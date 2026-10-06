"""
Seed command — idempotent demo data.

Demo logins (password for all: medislot123)
  Patients: patient1, patient2, patient3
  Doctors:  dr_meera, dr_arjun, dr_sana, dr_rohan, dr_nisha, dr_vikram
  Admin:    admin

Run: python manage.py seed
"""
from datetime import datetime, time, timedelta

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.utils import timezone

from core import services
from core.models import Appointment, Availability, DoctorProfile, Slot, User

DOCS = [
    (
        "Meera",
        "Iyer",
        "Cardiology",
        900,
        12,
        "MI",
        "Consultant cardiologist at a Chennai heart clinic. DM (Cardiology), AIIMS Delhi. "
        "Focuses on preventive cardiology, hypertension, and post-angioplasty follow-up.",
    ),
    (
        "Arjun",
        "Kulkarni",
        "Dermatology",
        700,
        8,
        "AK",
        "Medical and cosmetic dermatologist practising in Pune. Treats acne, psoriasis, "
        "hair loss, and everyday skin concerns with a conservative first-line approach.",
    ),
    (
        "Sana",
        "Sheikh",
        "Pediatrics",
        600,
        10,
        "SS",
        "Paediatrician in Hyderabad with a decade in child health. Vaccination, growth "
        "monitoring, and developmental check-ups in a calm, child-friendly clinic.",
    ),
    (
        "Rohan",
        "Deshmukh",
        "General Physician",
        400,
        5,
        "RD",
        "Family physician in Nagpur offering same-week primary care: fever, diabetes "
        "reviews, and routine health checks without a long hospital wait.",
    ),
    (
        "Nisha",
        "Patil",
        "Orthopedics",
        850,
        15,
        "NP",
        "Orthopaedic surgeon specialising in knee pain, sports injuries, and joint "
        "replacement counselling. Practises in Pune with a strong rehab-first ethos.",
    ),
    (
        "Vikram",
        "Rao",
        "Neurology",
        1100,
        18,
        "VR",
        "Neurologist (DM, NIMHANS) seeing headache, epilepsy, and stroke follow-up "
        "patients in Bengaluru. Clear explanations, measured investigations.",
    ),
]

PATIENTS = [
    ("patient1", "Aarav", "Shah", "aarav@example.com", "+91 98765 43210"),
    ("patient2", "Priya", "Mehta", "priya@example.com", "+91 87654 32109"),
    ("patient3", "Karthik", "Nair", "karthik@example.com", "+91 76543 21098"),
]


class Command(BaseCommand):
    help = "Idempotent demo data for MediSlot. Run: python manage.py seed"

    def handle(self, *args, **options):
        self._create_admin()
        patients = [self._get_or_create_patient(*p) for p in PATIENTS]
        for row in DOCS:
            doc = self._get_or_create_doctor(*row)
            self._seed_availability(doc)
            services.generate_slots(doc, days=14)
            self._seed_past_appointments(doc, patients)
        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write("  Demo logins (all passwords: medislot123)")
        self.stdout.write("  Patients: patient1, patient2, patient3")
        self.stdout.write("  Doctors:  dr_meera, dr_arjun, dr_sana, dr_rohan, dr_nisha, dr_vikram")
        self.stdout.write("  Admin:    admin")

    def _create_admin(self):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "medislot123")

    def _get_or_create_patient(self, username, first, last, email, phone):
        u, new = User.objects.get_or_create(
            username=username,
            defaults=dict(
                first_name=first,
                last_name=last,
                email=email,
                phone=phone,
                password=make_password("medislot123"),
            ),
        )
        if not new:
            u.email = email
            u.phone = phone
            u.first_name = first
            u.last_name = last
            u.save(update_fields=["email", "phone", "first_name", "last_name"])
        return u

    def _get_or_create_doctor(self, first, last, spec, fee, exp, initials, bio):
        username = f"dr_{first.lower()}"
        u, _ = User.objects.get_or_create(
            username=username,
            defaults=dict(
                first_name=first,
                last_name=last,
                role="doctor",
                email=f"{first.lower()}@example.com",
                password=make_password("medislot123"),
                avatar_initials=initials,
            ),
        )
        if not u.avatar_initials:
            u.avatar_initials = initials
            u.save(update_fields=["avatar_initials"])
        d, created = DoctorProfile.objects.get_or_create(
            user=u,
            defaults=dict(
                specialization=spec,
                fee=fee,
                experience_years=exp,
                bio=bio,
                approved=True,
            ),
        )
        if not created:
            d.specialization = spec
            d.fee = fee
            d.experience_years = exp
            d.bio = bio
            d.approved = True
            d.save()
        return d

    def _seed_availability(self, doc):
        for wd in range(5):
            Availability.objects.get_or_create(
                doctor=doc,
                weekday=wd,
                start_time=time(10),
                end_time=time(13),
                defaults={"slot_minutes": 30},
            )
        for wd in (1, 3):
            Availability.objects.get_or_create(
                doctor=doc,
                weekday=wd,
                start_time=time(15),
                end_time=time(17),
                defaults={"slot_minutes": 30},
            )

    def _seed_past_appointments(self, doc, patients):
        today = timezone.localdate()
        past_statuses = ["completed", "cancelled", "no_show", "completed", "completed"]
        for i, status in enumerate(past_statuses):
            day = today - timedelta(days=i + 2)
            start = timezone.make_aware(datetime.combine(day, time(11, 0)))
            end = start + timedelta(minutes=30)
            patient = patients[i % len(patients)]
            slot, _ = Slot.objects.get_or_create(
                doctor=doc,
                start=start,
                defaults={"end": end, "status": Slot.BOOKED},
            )
            if status != "cancelled" and slot.status != Slot.BOOKED:
                slot.status = Slot.BOOKED
                slot.save(update_fields=["status"])
            if status == "cancelled" and slot.status == Slot.BOOKED:
                # keep historical slot booked so it isn't regenerated as a past open slot
                pass
            appt, created = Appointment.objects.get_or_create(
                patient=patient,
                slot=slot,
                defaults={"status": status},
            )
            if created:
                appt._by = patient
                appt.status = status
                appt.save()
            elif appt.status != status:
                appt.status = status
                appt._by = patient
                appt.save()
