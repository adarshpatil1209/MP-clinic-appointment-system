"""All business rules live here: easy to explain, easy to test."""
from datetime import datetime, timedelta

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.core.mail import send_mail
from django.db import IntegrityError, OperationalError, transaction
from django.utils import timezone

from .models import Appointment, Slot


class BookingError(Exception):
    pass


class NotFoundError(Exception):
    pass


# ─── Slot generation ────────────────────────────────────────────────────────

def generate_slots(doctor, days=None):
    """Create slots for the next N days from weekly rules. Existing slots are never touched."""
    created, today = 0, timezone.localdate()
    horizon = settings.BOOKING_DAYS_AHEAD if days is None else days
    for rule in doctor.rules.all():
        for i in range(horizon + 1):
            day = today + timedelta(days=i)
            if day.weekday() != rule.weekday:
                continue
            t = timezone.make_aware(datetime.combine(day, rule.start_time))
            stop = timezone.make_aware(datetime.combine(day, rule.end_time))
            step = timedelta(minutes=rule.slot_minutes)
            while t + step <= stop:
                if t > timezone.now():
                    _, new = Slot.objects.get_or_create(
                        doctor=doctor,
                        start=t,
                        defaults={"end": t + step},
                    )
                    created += int(new)
                t += step
    return created


@transaction.atomic
def regenerate_slots(doctor):
    """
    Only FUTURE and OPEN slots are removed.
    Booked/past/completed slots are never altered.
    """
    removed, _ = Slot.objects.filter(
        doctor=doctor, status=Slot.OPEN, start__gt=timezone.now()
    ).delete()
    created = generate_slots(doctor)
    kept = Slot.objects.filter(
        doctor=doctor, status=Slot.BOOKED, start__gt=timezone.now()
    ).count()
    return {"removed": removed, "created": created, "booked_untouched": kept}


def topup_slots(doctor):
    """
    Lazy top-up: called when a doctor profile or slot API is requested.
    Generates any missing future slots without removing existing ones.
    """
    return generate_slots(doctor)


# ─── Booking ────────────────────────────────────────────────────────────────

def book_slot(user, slot_id):
    """
    Row lock inside a transaction + DB unique constraint as the final guard.
    Also blocks a patient from having two active appointments at the same start time.
    Cancelled appointments do not block a later booking of the same slot.
    """
    try:
        with transaction.atomic():
            slot = (
                Slot.objects.select_for_update()
                .select_related("doctor__user")
                .filter(pk=slot_id)
                .first()
            )
            if slot is None:
                raise NotFoundError("This slot no longer exists.")
            if slot.start <= timezone.now():
                raise BookingError("This slot is in the past or no longer exists.")
            if slot.status != Slot.OPEN:
                raise BookingError("Someone just booked this slot. Pick another time.")

            clash = Appointment.objects.filter(
                patient=user,
                slot__start=slot.start,
                status__in=Appointment.ACTIVE,
            ).exists()
            if clash:
                raise BookingError(
                    "You already have an active appointment at this time. "
                    "Please cancel it first or choose a different slot."
                )

            slot.status = Slot.BOOKED
            slot.save(update_fields=["status"])
            appt = Appointment(patient=user, slot=slot)
            appt._by = user
            appt.save()
    except (IntegrityError, OperationalError):
        raise BookingError("Someone just booked this slot. Pick another time.")

    _notify_patient(appt, "booked")
    _notify_doctor(appt, "booked")
    return appt


# ─── Status transitions ──────────────────────────────────────────────────────

def change_status(appt, new_status, by):
    """
    Patients may only cancel their own (before cutoff).
    Doctors manage their own queue, but only within the allowed transition map.
    """
    is_doctor = by.role == "doctor" and appt.slot.doctor.user_id == by.id
    is_owner = appt.patient_id == by.id

    if not (is_doctor or is_owner):
        raise PermissionDenied("You do not have permission to change this appointment.")

    allowed = Appointment.TRANSITIONS.get(appt.status, set())
    if new_status not in allowed:
        label = dict(Appointment.STATUSES).get(new_status, new_status)
        raise BookingError(
            f"Cannot move from '{appt.get_status_display()}' to '{label}'. "
            f"Allowed next statuses: {', '.join(sorted(allowed)) if allowed else 'none (final state)'}."
        )

    if is_owner and not is_doctor:
        if new_status != "cancelled":
            raise PermissionDenied("Patients may only cancel appointments.")
        if not appt.can_cancel:
            raise BookingError(
                f"Cancellations close {settings.CANCEL_CUTOFF_HOURS} hours before the appointment."
            )

    with transaction.atomic():
        appt._by = by
        appt.status = new_status
        appt.save()
        if new_status == "cancelled":
            Slot.objects.filter(pk=appt.slot_id).update(status=Slot.OPEN)

    _notify_patient(appt, new_status)
    if new_status == "cancelled":
        _notify_doctor(appt, new_status)
    return appt


# ─── Notifications ───────────────────────────────────────────────────────────

def _notify_patient(appt, what):
    if not appt.patient.email:
        return
    send_mail(
        subject=f"MediSlot: appointment {what}",
        message=(
            f"Dear {appt.patient.display_name},\n\n"
            f"Your appointment with {appt.slot.doctor} on "
            f"{timezone.localtime(appt.slot.start):%d %b %Y, %H:%M} is now: {appt.status}.\n\n"
            f"— MediSlot"
        ),
        from_email="noreply@medislot.local",
        recipient_list=[appt.patient.email],
        fail_silently=True,
    )


def _notify_doctor(appt, what):
    doc_email = appt.slot.doctor.user.email
    if not doc_email:
        return
    send_mail(
        subject=f"MediSlot: patient {what} appointment",
        message=(
            f"Dear {appt.slot.doctor},\n\n"
            f"Patient {appt.patient.display_name} has {what} an appointment "
            f"on {timezone.localtime(appt.slot.start):%d %b %Y, %H:%M}.\n\n"
            f"— MediSlot"
        ),
        from_email="noreply@medislot.local",
        recipient_list=[doc_email],
        fail_silently=True,
    )
