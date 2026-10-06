from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q
from django.utils import timezone


class User(AbstractUser):
    ROLES = [("patient", "Patient"), ("doctor", "Doctor")]
    role = models.CharField(max_length=8, choices=ROLES, default="patient")
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.URLField(blank=True, max_length=500, help_text="URL to profile picture")
    avatar_initials = models.CharField(
        max_length=4,
        blank=True,
        help_text="Override letters shown in the avatar (e.g. MI).",
    )

    @property
    def display_name(self):
        return self.get_full_name() or self.username

    @property
    def initials(self):
        if self.avatar_initials.strip():
            return self.avatar_initials.strip().upper()[:4]
        parts = self.display_name.split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return self.display_name[:2].upper()


class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="doctor")
    specialization = models.CharField(max_length=80, default="General Physician")
    fee = models.DecimalField(max_digits=7, decimal_places=2, default=500)
    experience_years = models.PositiveSmallIntegerField(default=1)
    bio = models.TextField(blank=True)
    approved = models.BooleanField(default=True)

    def __str__(self):
        return f"Dr. {self.user.display_name}"

    @property
    def next_available(self):
        cached = getattr(self, "_next_slot", None)
        if cached is not None:
            return timezone.localtime(cached.start) if cached else None
        s = (
            self.slots.filter(status="open", start__gt=timezone.now())
            .order_by("start")
            .first()
        )
        return timezone.localtime(s.start) if s else None


class Availability(models.Model):
    """Recurring weekly rule. Slots are generated from this."""

    WEEKDAYS = list(
        enumerate(
            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        )
    )
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name="rules")
    weekday = models.PositiveSmallIntegerField(choices=WEEKDAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_minutes = models.PositiveSmallIntegerField(default=30)

    class Meta:
        ordering = ["weekday", "start_time"]
        verbose_name_plural = "availabilities"

    def __str__(self):
        return (
            f"{self.doctor} {self.get_weekday_display()} "
            f"{self.start_time:%H:%M}-{self.end_time:%H:%M}"
        )


class Slot(models.Model):
    OPEN, BOOKED = "open", "booked"
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name="slots")
    start = models.DateTimeField()
    end = models.DateTimeField()
    status = models.CharField(
        max_length=6, choices=[(OPEN, "Open"), (BOOKED, "Booked")], default=OPEN
    )

    class Meta:
        ordering = ["start"]
        constraints = [
            models.UniqueConstraint(fields=["doctor", "start"], name="unique_doctor_slot_start")
        ]

    def __str__(self):
        return f"{self.doctor} @ {timezone.localtime(self.start):%d %b %H:%M}"


class Appointment(models.Model):
    ACTIVE = ["pending", "confirmed"]
    FINAL = ["completed", "cancelled", "no_show"]
    STATUSES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("no_show", "No-show"),
    ]
    TRANSITIONS = {
        "pending": {"confirmed", "cancelled", "no_show"},
        "confirmed": {"completed", "cancelled", "no_show"},
        "completed": set(),
        "cancelled": set(),
        "no_show": set(),
    }

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="appointments"
    )
    slot = models.ForeignKey(Slot, on_delete=models.PROTECT, related_name="appointments")
    status = models.CharField(max_length=10, choices=STATUSES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["slot__start"]
        constraints = [
            models.UniqueConstraint(
                fields=["slot"],
                condition=Q(status__in=["pending", "confirmed", "completed", "no_show"]),
                name="one_active_appointment_per_slot",
            )
        ]

    @property
    def can_cancel(self):
        return (
            self.status in self.ACTIVE
            and self.slot.start - timezone.now() >= timedelta(hours=settings.CANCEL_CUTOFF_HOURS)
        )

    def allowed_next(self):
        return sorted(self.TRANSITIONS.get(self.status, set()))


class StatusLog(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name="logs")
    old_status = models.CharField(max_length=10, blank=True)
    new_status = models.CharField(max_length=10)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["changed_at"]
