import json
from datetime import datetime, timedelta
from functools import wraps

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.core.exceptions import PermissionDenied
from django.db.models import Prefetch
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from . import services
from .forms import (
    AvailabilityForm,
    DoctorProfileForm,
    LoginForm,
    PasswordChangeForm,
    PatientProfileForm,
    RegisterForm,
)
from .models import Appointment, Availability, DoctorProfile, Slot


def role_required(role):
    def deco(view):
        @wraps(view)
        @login_required
        def wrapper(request, *a, **kw):
            if request.user.role != role:
                raise PermissionDenied(
                    f"This page is for {role}s. You are signed in as a {request.user.role}."
                )
            return view(request, *a, **kw)

        return wrapper

    return deco


def json_role_required(role):
    def deco(view):
        @wraps(view)
        def wrapper(request, *a, **kw):
            if not request.user.is_authenticated:
                return _json_error("Please log in to continue.", 403)
            if request.user.role != role:
                return _json_error("You do not have permission to perform this action.", 403)
            return view(request, *a, **kw)

        return wrapper

    return deco


def _json_error(msg, status=400):
    return JsonResponse({"error": str(msg)}, status=status)


def _local_day_bounds(day):
    lo = timezone.make_aware(datetime.combine(day, datetime.min.time()))
    return lo, lo + timedelta(days=1)


def _open_local_dates(doctor, days=14):
    today = timezone.localdate()
    lo, _ = _local_day_bounds(today)
    hi, _ = _local_day_bounds(today + timedelta(days=days))
    slots = Slot.objects.filter(
        doctor=doctor,
        status=Slot.OPEN,
        start__gt=timezone.now(),
        start__gte=lo,
        start__lt=hi,
    ).only("start")
    return sorted({timezone.localtime(s.start).date() for s in slots})


class MediLoginView(LoginView):
    authentication_form = LoginForm
    template_name = "registration/login.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        nxt = self.request.GET.get("next") or self.request.POST.get("next") or ""
        reason = self.request.GET.get("reason") or ""
        if reason == "find" or "/doctors" in nxt:
            ctx["login_explain"] = (
                "Log in as a patient to browse doctors, see real open slots, and book."
            )
        else:
            ctx["login_explain"] = ""
        ctx["next"] = nxt
        return ctx


def landing(request):
    approved = DoctorProfile.objects.filter(approved=True).select_related("user")
    specs = (
        approved.values_list("specialization", flat=True).distinct().order_by("specialization")
    )
    return render(
        request,
        "landing.html",
        {"specs": specs, "doctor_count": approved.count()},
    )


def register(request):
    next_url = request.GET.get("next", "") or request.POST.get("next", "")
    form = RegisterForm(request.POST or None)
    if form.is_valid():
        user = form.save()
        if user.role == "doctor":
            DoctorProfile.objects.create(user=user)
        login(request, user)
        return redirect(next_url or "home")
    return render(request, "registration/register.html", {"form": form, "next": next_url})


@login_required
def home(request):
    return redirect("dashboard" if request.user.role == "doctor" else "doctors")


@role_required("patient")
def doctors(request):
    qs = DoctorProfile.objects.filter(approved=True).select_related("user").prefetch_related("rules")
    for d in qs:
        services.topup_slots(d)

    qs = DoctorProfile.objects.filter(approved=True).select_related("user").prefetch_related(
        Prefetch(
            "slots",
            queryset=Slot.objects.filter(status=Slot.OPEN, start__gt=timezone.now()).order_by("start"),
            to_attr="open_future",
        )
    )

    spec_filter = request.GET.get("spec", "").strip()
    sort = request.GET.get("sort", "").strip()
    q = request.GET.get("q", "").strip()
    date_str = request.GET.get("date", "").strip()
    day = None
    if date_str:
        try:
            day = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            date_str = ""
            messages.error(request, "Invalid date filter. Use YYYY-MM-DD.")

    data = []
    for d in qs:
        nxt = d.open_future[0] if d.open_future else None
        d._next_slot = nxt
        if spec_filter and d.specialization != spec_filter:
            continue
        if q and q.lower() not in d.user.display_name.lower() and q.lower() not in d.specialization.lower():
            continue
        if day:
            lo, hi = _local_day_bounds(day)
            if not any(lo <= s.start < hi for s in d.open_future):
                continue
        data.append(d)

    if sort == "fee":
        data.sort(key=lambda d: d.fee)
    elif sort == "experience":
        data.sort(key=lambda d: -d.experience_years)
    else:
        data.sort(key=lambda d: (d.next_available is None, d.next_available or timezone.now()))

    specs = sorted(
        DoctorProfile.objects.filter(approved=True)
        .values_list("specialization", flat=True)
        .distinct()
    )
    return render(
        request,
        "doctors.html",
        {
            "doctors": data,
            "specs": specs,
            "spec_filter": spec_filter,
            "sort": sort,
            "q": q,
            "date_filter": date_str,
        },
    )


@role_required("patient")
def doctor_profile(request, pk):
    doc = get_object_or_404(
        DoctorProfile.objects.filter(approved=True).select_related("user"), pk=pk
    )
    services.topup_slots(doc)
    days_with_slots = _open_local_dates(doc, days=settings.BOOKING_DAYS_AHEAD)
    return render(
        request,
        "doctor_profile.html",
        {
            "doc": doc,
            "days_json": json.dumps([d.isoformat() for d in days_with_slots]),
        },
    )


@json_role_required("patient")
def slots_api(request, pk):
    date_str = request.GET.get("date", "")
    if not date_str:
        return _json_error("Missing ?date parameter (YYYY-MM-DD).")
    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return _json_error("Invalid date format. Use YYYY-MM-DD.")

    if not DoctorProfile.objects.filter(pk=pk, approved=True).exists():
        return _json_error("Doctor not found.", 404)

    lo, hi = _local_day_bounds(day)
    now = timezone.now()
    qs = Slot.objects.filter(
        doctor_id=pk,
        start__gte=max(lo, now),
        start__lt=hi,
    ).order_by("start")
    return JsonResponse(
        [
            {
                "id": s.id,
                "time": timezone.localtime(s.start).strftime("%H:%M"),
                "status": s.status,
            }
            for s in qs
        ],
        safe=False,
    )


@json_role_required("patient")
@require_POST
def book_api(request):
    try:
        body = json.loads(request.body)
        slot_id = int(body["slot_id"])
    except (json.JSONDecodeError, KeyError, ValueError, TypeError):
        return _json_error("Invalid request body.", 400)
    try:
        appt = services.book_slot(request.user, slot_id)
    except services.NotFoundError as e:
        return _json_error(str(e), 404)
    except services.BookingError as e:
        return _json_error(str(e), 409)
    except PermissionDenied as e:
        return _json_error(str(e), 403)
    return JsonResponse({"id": appt.id, "redirect": f"/appointments/{appt.id}/"})


@role_required("patient")
def my_appointments(request):
    now = timezone.now()
    appts = list(
        Appointment.objects.filter(patient=request.user)
        .select_related("slot__doctor__user")
        .prefetch_related("logs__changed_by")
    )
    upcoming = [a for a in appts if a.status in Appointment.ACTIVE and a.slot.start > now]
    past = [
        a
        for a in appts
        if a.status in ("completed", "no_show")
        or (a.status in Appointment.ACTIVE and a.slot.start <= now)
    ]
    cancelled = [a for a in appts if a.status == "cancelled"]
    return render(
        request,
        "appointments.html",
        {"upcoming": upcoming, "past": past, "cancelled": cancelled},
    )


@role_required("patient")
def appointment_detail(request, pk):
    appt = get_object_or_404(
        Appointment.objects.select_related("slot__doctor__user", "patient").prefetch_related(
            "logs__changed_by"
        ),
        pk=pk,
    )
    if appt.patient_id != request.user.id:
        raise PermissionDenied("You can only view your own appointments.")
    return render(request, "appointment_detail.html", {"appt": appt})


@role_required("patient")
@require_POST
def cancel(request, pk):
    appt = get_object_or_404(Appointment, pk=pk)
    if appt.patient_id != request.user.id:
        raise PermissionDenied("You can only cancel your own appointments.")
    try:
        services.change_status(appt, "cancelled", request.user)
        messages.success(request, "Appointment cancelled successfully.")
    except (services.BookingError, PermissionDenied) as e:
        messages.error(request, str(e))
    nxt = request.POST.get("next") or "appointments"
    if nxt == "detail":
        return redirect("appointment_detail", pk=pk)
    return redirect("appointments")


@role_required("patient")
def patient_profile(request):
    if request.method == "POST" and "save_profile" in request.POST:
        profile_form = PatientProfileForm(request.POST, instance=request.user)
        pw_form = PasswordChangeForm(request.user)
        if profile_form.is_valid():
            profile_form.save()
            messages.success(request, "Profile updated.")
            return redirect("patient_profile")
    elif request.method == "POST" and "change_password" in request.POST:
        profile_form = PatientProfileForm(instance=request.user)
        pw_form = PasswordChangeForm(request.user, request.POST)
        if pw_form.is_valid():
            pw_form.save()
            update_session_auth_hash(request, pw_form.user)
            messages.success(request, "Password changed.")
            return redirect("patient_profile")
    else:
        profile_form = PatientProfileForm(instance=request.user)
        pw_form = PasswordChangeForm(request.user)

    return render(
        request,
        "patient_profile.html",
        {"form": profile_form, "pw_form": pw_form},
    )


@role_required("doctor")
def dashboard(request):
    doc, now = request.user.doctor, timezone.now()
    when = request.GET.get("when", "today")
    qs = Appointment.objects.filter(slot__doctor=doc).select_related("patient", "slot")
    today = timezone.localdate()
    start, _ = _local_day_bounds(today)

    week_qs = qs.filter(
        slot__start__gte=start,
        slot__start__lt=start + timedelta(days=7),
    ).exclude(status="cancelled")

    ranges = {
        "today": qs.filter(slot__start__gte=start, slot__start__lt=start + timedelta(days=1)),
        "week": week_qs,
        "upcoming": qs.filter(slot__start__gte=start + timedelta(days=1)).exclude(status="cancelled"),
        "past": qs.filter(slot__start__lt=start),
    }

    stats = {
        "today": ranges["today"].exclude(status="cancelled").count(),
        "week": week_qs.count(),
        "pending": qs.filter(status="pending").count(),
        "completed_week": qs.filter(
            status="completed",
            slot__start__gte=start - timedelta(days=7),
            slot__start__lt=start + timedelta(days=1),
        ).count(),
        "no_shows": qs.filter(status="no_show").count(),
    }

    appts = list(ranges.get(when, ranges["today"]).order_by("slot__start"))
    for a in appts:
        a.allowed_json = json.dumps(a.allowed_next())
    return render(
        request,
        "dashboard.html",
        {
            "appts": appts,
            "when": when,
            "stats": stats,
            "statuses": Appointment.STATUSES,
            "now": now,
        },
    )


@json_role_required("doctor")
@require_POST
def status_api(request, pk):
    try:
        appt = Appointment.objects.select_related("slot__doctor__user", "patient").get(pk=pk)
    except Appointment.DoesNotExist:
        return _json_error("Appointment not found.", 404)

    try:
        body = json.loads(request.body)
        new = body["status"]
    except (json.JSONDecodeError, KeyError, TypeError):
        return _json_error("Invalid request body.", 400)

    if new not in dict(Appointment.STATUSES):
        return _json_error(f"Unknown status '{new}'.", 400)

    try:
        services.change_status(appt, new, request.user)
    except PermissionDenied as e:
        return _json_error(str(e), 403)
    except services.BookingError as e:
        return _json_error(str(e), 409)

    return JsonResponse(
        {
            "status": appt.status,
            "label": appt.get_status_display(),
            "allowed": appt.allowed_next(),
        }
    )


@role_required("doctor")
def availability(request):
    doc = request.user.doctor
    edit_pk = request.GET.get("edit")
    edit_rule = None
    if edit_pk:
        edit_rule = get_object_or_404(Availability, pk=edit_pk, doctor=doc)

    form = AvailabilityForm(request.POST or None, instance=edit_rule)

    if request.method == "POST":
        if "delete" in request.POST:
            Availability.objects.filter(pk=request.POST["delete"], doctor=doc).delete()
            r = services.regenerate_slots(doc)
            messages.success(request, f"Rule deleted. {r['created']} slots regenerated.")
            return redirect("availability")

        if form.is_valid():
            try:
                form.validate_overlap(doc, exclude_pk=edit_rule.pk if edit_rule else None)
            except Exception as e:
                form.add_error(None, str(e))
            else:
                rule = form.save(commit=False)
                rule.doctor = doc
                rule.save()
                r = services.regenerate_slots(doc)
                messages.success(
                    request,
                    f"{'Updated' if edit_rule else 'Added'}. {r['created']} slots generated.",
                )
                return redirect("availability")

    return render(
        request,
        "availability.html",
        {
            "form": form,
            "rules": doc.rules.all(),
            "edit_rule": edit_rule,
        },
    )


@role_required("doctor")
def doctor_settings(request):
    doc = request.user.doctor
    if request.method == "POST" and "save_profile" in request.POST:
        profile_form = DoctorProfileForm(request.POST, instance=doc)
        user_form = PatientProfileForm(request.POST, instance=request.user)
        pw_form = PasswordChangeForm(request.user)
        if profile_form.is_valid() and user_form.is_valid():
            profile_form.save()
            user_form.save()
            messages.success(request, "Profile updated.")
            return redirect("doctor_settings")
    elif request.method == "POST" and "change_password" in request.POST:
        profile_form = DoctorProfileForm(instance=doc)
        user_form = PatientProfileForm(instance=request.user)
        pw_form = PasswordChangeForm(request.user, request.POST)
        if pw_form.is_valid():
            pw_form.save()
            update_session_auth_hash(request, pw_form.user)
            messages.success(request, "Password changed.")
            return redirect("doctor_settings")
    else:
        profile_form = DoctorProfileForm(instance=doc)
        user_form = PatientProfileForm(instance=request.user)
        pw_form = PasswordChangeForm(request.user)

    return render(
        request,
        "doctor_settings.html",
        {"profile_form": profile_form, "pw_form": pw_form, "doc": doc, "user_form": user_form},
    )


def forbidden(request, exception=None):
    if request.path.startswith("/api/"):
        return _json_error(str(exception or "Forbidden."), 403)
    return render(
        request,
        "403.html",
        {"exception": exception},
        status=403,
    )


def not_found(request, exception=None):
    if request.path.startswith("/api/"):
        return _json_error("Not found.", 404)
    return render(request, "404.html", status=404)
