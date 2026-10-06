"""
MediSlot test suite.

Run: python manage.py test core
"""
import json
import threading
from datetime import timedelta

from django.core.exceptions import PermissionDenied
from django.db import connection
from django.test import Client, TestCase, TransactionTestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from . import services
from .models import Appointment, Availability, DoctorProfile, Slot, StatusLog, User


def make_doctor(username="doc1"):
    u = User.objects.create_user(username, email=f"{username}@ex.com", password="x", role="doctor")
    return DoctorProfile.objects.create(user=u)


def make_patient(username="pat1"):
    return User.objects.create_user(username, email=f"{username}@ex.com", password="x")


def future_slot(doctor, days=2):
    t = timezone.now() + timedelta(days=days)
    return Slot.objects.create(doctor=doctor, start=t, end=t + timedelta(minutes=30))


def near_slot(doctor):
    t = timezone.now() + timedelta(minutes=30)
    return Slot.objects.create(doctor=doctor, start=t, end=t + timedelta(minutes=30))


def past_slot(doctor):
    t = timezone.now() - timedelta(days=1)
    return Slot.objects.create(doctor=doctor, start=t, end=t + timedelta(minutes=30))


class Rules(TestCase):
    def setUp(self):
        self.p1 = make_patient("a")
        self.p2 = make_patient("b")
        self.doc = make_doctor("d")
        self.far = future_slot(self.doc)
        self.near = near_slot(self.doc)
        self.past = past_slot(self.doc)

    def test_double_booking_rejected(self):
        services.book_slot(self.p1, self.far.id)
        with self.assertRaises(services.BookingError):
            services.book_slot(self.p2, self.far.id)

    def test_past_slot_rejected(self):
        with self.assertRaises(services.BookingError):
            services.book_slot(self.p1, self.past.id)

    def test_cancel_after_cutoff_rejected(self):
        a = services.book_slot(self.p1, self.near.id)
        with self.assertRaises(services.BookingError):
            services.change_status(a, "cancelled", self.p1)

    def test_other_patient_forbidden(self):
        a = services.book_slot(self.p1, self.far.id)
        with self.assertRaises(PermissionDenied):
            services.change_status(a, "cancelled", self.p2)

    def test_regen_keeps_booked_and_no_show_logged(self):
        a = services.book_slot(self.p1, self.far.id)
        services.regenerate_slots(self.doc)
        self.far.refresh_from_db()
        self.assertEqual(self.far.status, "booked")
        services.change_status(a, "no_show", self.doc.user)
        self.assertTrue(StatusLog.objects.filter(appointment=a, new_status="no_show").exists())

    def test_cancel_frees_slot(self):
        a = services.book_slot(self.p1, self.far.id)
        services.change_status(a, "cancelled", self.p1)
        self.far.refresh_from_db()
        self.assertEqual(self.far.status, "open")
        services.book_slot(self.p2, self.far.id)

    def test_missing_slot_not_found(self):
        with self.assertRaises(services.NotFoundError):
            services.book_slot(self.p1, 999999)


class StatusTransitionTests(TestCase):
    def setUp(self):
        self.p = make_patient("tp")
        self.doc = make_doctor("td")
        self.slot = future_slot(self.doc)
        self.appt = services.book_slot(self.p, self.slot.id)

    def _set(self, status):
        self.appt.status = status
        self.appt._by = self.doc.user
        self.appt.save()

    def test_pending_to_confirmed_allowed(self):
        services.change_status(self.appt, "confirmed", self.doc.user)
        self.assertEqual(self.appt.status, "confirmed")

    def test_pending_to_completed_blocked(self):
        with self.assertRaises(services.BookingError):
            services.change_status(self.appt, "completed", self.doc.user)

    def test_confirmed_to_completed_allowed(self):
        self._set("confirmed")
        services.change_status(self.appt, "completed", self.doc.user)
        self.assertEqual(self.appt.status, "completed")

    def test_confirmed_to_cancelled_allowed(self):
        self._set("confirmed")
        services.change_status(self.appt, "cancelled", self.doc.user)
        self.assertEqual(self.appt.status, "cancelled")

    def test_completed_is_final(self):
        self._set("completed")
        with self.assertRaises(services.BookingError):
            services.change_status(self.appt, "cancelled", self.doc.user)

    def test_cancelled_is_final(self):
        services.change_status(self.appt, "cancelled", self.p)
        with self.assertRaises(services.BookingError):
            services.change_status(self.appt, "confirmed", self.doc.user)

    def test_no_show_is_final(self):
        self._set("no_show")
        with self.assertRaises(services.BookingError):
            services.change_status(self.appt, "confirmed", self.doc.user)


class CrossDoctorTests(TestCase):
    def setUp(self):
        self.p = make_patient("xp")
        self.doc1 = make_doctor("xd1")
        self.doc2 = make_doctor("xd2")
        s = future_slot(self.doc1)
        self.appt = services.book_slot(self.p, s.id)

    def test_other_doctor_cannot_change_status(self):
        with self.assertRaises(PermissionDenied):
            services.change_status(self.appt, "confirmed", self.doc2.user)


class DuplicateTimeTests(TestCase):
    def setUp(self):
        self.p = make_patient("dp")
        self.doc1 = make_doctor("dd1")
        self.doc2 = make_doctor("dd2")
        same_time = timezone.now() + timedelta(days=3)
        self.s1 = Slot.objects.create(
            doctor=self.doc1, start=same_time, end=same_time + timedelta(minutes=30)
        )
        self.s2 = Slot.objects.create(
            doctor=self.doc2, start=same_time, end=same_time + timedelta(minutes=30)
        )

    def test_patient_cannot_double_book_same_time(self):
        services.book_slot(self.p, self.s1.id)
        with self.assertRaises(services.BookingError):
            services.book_slot(self.p, self.s2.id)


class OverlapValidationTests(TestCase):
    def setUp(self):
        from datetime import time

        self.doc = make_doctor("ov")
        Availability.objects.create(
            doctor=self.doc,
            weekday=0,
            start_time=time(9),
            end_time=time(12),
            slot_minutes=30,
        )

    def _form(self, start, end):
        from .forms import AvailabilityForm

        f = AvailabilityForm(
            data={
                "weekday": 0,
                "start_time": f"{start:02d}:00",
                "end_time": f"{end:02d}:00",
                "slot_minutes": 30,
            }
        )
        f.is_valid()
        return f

    def test_overlapping_rule_rejected(self):
        f = self._form(11, 14)
        with self.assertRaises(Exception):
            f.validate_overlap(self.doc)

    def test_non_overlapping_rule_accepted(self):
        f = self._form(13, 15)
        f.validate_overlap(self.doc)

    def test_edit_same_rule_not_self_overlap(self):
        rule = self.doc.rules.get(weekday=0)
        f = self._form(9, 12)
        f.validate_overlap(self.doc, exclude_pk=rule.pk)


class RegenerationTests(TestCase):
    def setUp(self):
        self.p = make_patient("rp")
        self.doc = make_doctor("rd")
        self.slot = future_slot(self.doc)

    def test_regen_leaves_booked_slots_untouched(self):
        services.book_slot(self.p, self.slot.id)
        services.regenerate_slots(self.doc)
        self.slot.refresh_from_db()
        self.assertEqual(self.slot.status, "booked")

    def test_regen_leaves_past_slots_untouched(self):
        ps = past_slot(self.doc)
        services.regenerate_slots(self.doc)
        ps.refresh_from_db()
        self.assertIsNotNone(ps.pk)

    def test_regen_leaves_completed_booked_slots(self):
        a = services.book_slot(self.p, self.slot.id)
        a.status = "completed"
        a._by = self.doc.user
        a.save()
        services.regenerate_slots(self.doc)
        self.slot.refresh_from_db()
        self.assertEqual(self.slot.status, "booked")
        self.assertTrue(Slot.objects.filter(pk=self.slot.pk).exists())


class ViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.patient = make_patient("vp")
        self.doctor = make_doctor("vd")
        self.other_patient = make_patient("vop")

    def _login(self, user):
        self.client.force_login(user)

    def test_landing_anonymous(self):
        r = self.client.get(reverse("landing"))
        self.assertEqual(r.status_code, 200)

    def test_doctors_requires_patient(self):
        r = self.client.get(reverse("doctors"))
        self.assertEqual(r.status_code, 302)

    def test_doctors_patient_ok(self):
        self._login(self.patient)
        r = self.client.get(reverse("doctors"))
        self.assertEqual(r.status_code, 200)

    def test_doctors_doctor_403(self):
        self._login(self.doctor.user)
        r = self.client.get(reverse("doctors"))
        self.assertEqual(r.status_code, 403)

    def test_dashboard_doctor_ok(self):
        self._login(self.doctor.user)
        r = self.client.get(reverse("dashboard"))
        self.assertEqual(r.status_code, 200)

    def test_dashboard_patient_403(self):
        self._login(self.patient)
        r = self.client.get(reverse("dashboard"))
        self.assertEqual(r.status_code, 403)

    def test_availability_patient_403(self):
        self._login(self.patient)
        r = self.client.get(reverse("availability"))
        self.assertEqual(r.status_code, 403)

    def test_patient_profile_doctor_403(self):
        self._login(self.doctor.user)
        r = self.client.get(reverse("patient_profile"))
        self.assertEqual(r.status_code, 403)

    def test_appointment_detail_other_patient_403(self):
        slot = future_slot(self.doctor)
        appt = services.book_slot(self.patient, slot.id)
        self._login(self.other_patient)
        r = self.client.get(reverse("appointment_detail", args=[appt.id]))
        self.assertEqual(r.status_code, 403)

    def test_appointment_detail_owner_200(self):
        slot = future_slot(self.doctor)
        appt = services.book_slot(self.patient, slot.id)
        self._login(self.patient)
        r = self.client.get(reverse("appointment_detail", args=[appt.id]))
        self.assertEqual(r.status_code, 200)

    def test_slots_api_missing_date(self):
        self._login(self.patient)
        r = self.client.get(reverse("slots_api", args=[self.doctor.id]))
        self.assertEqual(r.status_code, 400)
        self.assertIn("error", r.json())

    def test_slots_api_invalid_date(self):
        self._login(self.patient)
        r = self.client.get(reverse("slots_api", args=[self.doctor.id]) + "?date=not-a-date")
        self.assertEqual(r.status_code, 400)

    def test_book_api_missing_slot_404(self):
        self._login(self.patient)
        r = self.client.post(
            reverse("book_api"),
            data=json.dumps({"slot_id": 999999}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 404)
        self.assertIn("error", r.json())

    def test_status_api_invalid_transition_returns_json(self):
        slot = future_slot(self.doctor)
        appt = services.book_slot(self.patient, slot.id)
        self._login(self.doctor.user)
        r = self.client.post(
            reverse("status_api", args=[appt.id]),
            data=json.dumps({"status": "completed"}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 409)
        self.assertIn("error", r.json())

    def test_status_api_another_doctor_403(self):
        other_doc = make_doctor("od2")
        slot = future_slot(self.doctor)
        appt = services.book_slot(self.patient, slot.id)
        self._login(other_doc.user)
        r = self.client.post(
            reverse("status_api", args=[appt.id]),
            data=json.dumps({"status": "confirmed"}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 403)
        self.assertIn("error", r.json())

    def test_unapproved_doctor_hidden(self):
        self.doctor.approved = False
        self.doctor.save()
        self._login(self.patient)
        r = self.client.get(reverse("doctors"))
        self.assertNotContains(r, self.doctor.user.username)
        r2 = self.client.get(reverse("doctor_profile", args=[self.doctor.id]))
        self.assertEqual(r2.status_code, 404)

    def test_register_requires_email(self):
        r = self.client.post(
            reverse("register"),
            {
                "first_name": "Neha",
                "last_name": "Joshi",
                "username": "neha_j",
                "password1": "medislot123x",
                "password2": "medislot123x",
                "role": "patient",
            },
        )
        self.assertEqual(r.status_code, 200)
        self.assertFalse(User.objects.filter(username="neha_j").exists())

    @override_settings(DEBUG=False, ALLOWED_HOSTS=["*"])
    def test_404_page_renders(self):
        r = self.client.get("/definitely-missing-page/")
        self.assertEqual(r.status_code, 404)


class ConcurrencyTests(TransactionTestCase):
    """
    Proves that exactly one of two simultaneous bookings succeeds.
    Requires PostgreSQL row-level locks; skipped on SQLite.
    """

    def setUp(self):
        self.p1 = make_patient("cp1")
        self.p2 = make_patient("cp2")
        self.doc = make_doctor("cd")
        self.slot = future_slot(self.doc)

    def test_only_one_concurrent_booking_succeeds(self):
        if connection.vendor != "postgresql":
            self.skipTest("Concurrency lock test requires PostgreSQL")

        results = []

        def book(patient):
            try:
                a = services.book_slot(patient, self.slot.id)
                results.append(("ok", a.id))
            except services.BookingError as e:
                results.append(("err", str(e)))
            finally:
                connection.close()   # each thread owns a DB connection; close it so test DB teardown works

        t1 = threading.Thread(target=book, args=(self.p1,))
        t2 = threading.Thread(target=book, args=(self.p2,))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        ok = [r for r in results if r[0] == "ok"]
        err = [r for r in results if r[0] == "err"]
        self.assertEqual(len(ok), 1, f"Expected 1 success, got: {results}")
        self.assertEqual(len(err), 1, f"Expected 1 failure, got: {results}")


class AdditionalTests(TestCase):
    def _login(self, user):
        """Helper to login a user"""
        self.client.force_login(user)

    def test_404_page_renders_with_debug_false(self):
        """404 page renders correctly when DEBUG=False"""
        with override_settings(DEBUG=False, ALLOWED_HOSTS=["*"]):
            r = self.client.get("/nonexistent-page/")
            self.assertEqual(r.status_code, 404)
            self.assertIn(b"Page Not Found", r.content)

    def test_403_page_role_aware_with_debug_false(self):
        """403 page is role-aware when DEBUG=False"""
        p = make_patient("up2")
        self._login(p)
        with override_settings(DEBUG=False, ALLOWED_HOSTS=["*"]):
            r = self.client.get(reverse("dashboard"))
            self.assertEqual(r.status_code, 403)
            self.assertIn(b"You are signed in as a patient", r.content)

    def test_email_required_on_registration(self):
        """Email field is required during registration"""
        r = self.client.post(
            reverse("register"),
            {
                "first_name": "Test",
                "last_name": "User",
                "username": "testuser3",
                "password1": "testpass123",
                "password2": "testpass123",
                "role": "patient",
            },
        )
        self.assertEqual(r.status_code, 200)
        self.assertFalse(User.objects.filter(username="testuser3").exists())
