"""
Management command: generate_slots

Generates future open slots for all doctors from their weekly availability rules.
Safe to run multiple times — existing slots are never duplicated or altered.

Usage:
    python manage.py generate_slots
    python manage.py generate_slots --days 14
    python manage.py generate_slots --doc 3

Daily (cron):
    0 6 * * * /path/to/venv/bin/python /path/to/manage.py generate_slots --days 14

Windows Task Scheduler (daily at 06:00):
    python C:\\path\\to\\manage.py generate_slots --days 14
"""
from django.core.management.base import BaseCommand

from core import services
from core.models import DoctorProfile


class Command(BaseCommand):
    help = "Generate future open slots for doctors from their weekly availability rules."

    def add_arguments(self, parser):
        parser.add_argument(
            "--doc",
            type=int,
            default=None,
            help="DoctorProfile pk. If omitted, all approved doctors are processed.",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=None,
            help="How many days ahead to generate (default: BOOKING_DAYS_AHEAD).",
        )

    def handle(self, *args, **options):
        if options["doc"]:
            doctors = DoctorProfile.objects.filter(pk=options["doc"]).prefetch_related("rules")
            if not doctors.exists():
                self.stderr.write(f"No DoctorProfile with pk={options['doc']}.")
                return
        else:
            doctors = DoctorProfile.objects.filter(approved=True).prefetch_related("rules")

        total = 0
        for doc in doctors:
            created = services.generate_slots(doc, days=options["days"])
            total += created
            if created:
                self.stdout.write(f"  {doc}: {created} new slot(s)")

        self.stdout.write(
            self.style.SUCCESS(
                f"Done — {total} slot(s) created across {doctors.count()} doctor(s)."
            )
        )
