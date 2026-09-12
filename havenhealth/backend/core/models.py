from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Service(models.Model):
    """A clinical service offered on the platform (Cardiology, Dental Care, ...)."""

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    icon = models.CharField(
        max_length=40,
        default="heart",
        help_text="Icon key used by the frontend icon set.",
    )
    short_description = models.CharField(max_length=240)
    description = models.TextField(blank=True)
    accent = models.CharField(
        max_length=20,
        default="teal",
        help_text="Which accent treatment the card should use.",
    )
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Doctor(models.Model):
    """A practitioner available for consultation."""

    class Availability(models.TextChoices):
        AVAILABLE_NOW = "available", "Available now"
        TODAY = "today", "Available today"
        BOOKED = "booked", "Fully booked"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="doctor_profile",
    )
    full_name = models.CharField(max_length=120)
    specialty = models.CharField(max_length=120)
    services = models.ManyToManyField(Service, related_name="doctors", blank=True)
    bio = models.TextField(blank=True)
    years_experience = models.PositiveIntegerField(default=1)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=4.8,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    patients_helped = models.PositiveIntegerField(default=0)
    availability = models.CharField(
        max_length=12, choices=Availability.choices, default=Availability.TODAY
    )
    photo_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "full_name"]

    def __str__(self):
        return f"Dr. {self.full_name}"


class PricingPlan(models.Model):
    name = models.CharField(max_length=80)
    price_per_month = models.DecimalField(max_digits=8, decimal_places=2)
    tagline = models.CharField(max_length=160, blank=True)
    features = models.JSONField(default=list, help_text="List of feature strings.")
    is_highlighted = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class Testimonial(models.Model):
    author_name = models.CharField(max_length=120)
    author_role = models.CharField(max_length=120, blank=True)
    quote = models.TextField()
    avatar_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.author_name


class FAQ(models.Model):
    question = models.CharField(max_length=220)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"

    def __str__(self):
        return self.question


class ConsultationRequest(models.Model):
    """A patient's booking request - the core transactional object of the app."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class ConsultationType(models.TextChoices):
        VIDEO = "video", "Video consultation"
        IN_PERSON = "in_person", "In-person visit"
        PHONE = "phone", "Phone call"

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="consultation_requests",
    )
    doctor = models.ForeignKey(
        Doctor, on_delete=models.CASCADE, related_name="consultation_requests"
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="consultation_requests",
    )
    consultation_type = models.CharField(
        max_length=12,
        choices=ConsultationType.choices,
        default=ConsultationType.VIDEO,
    )
    preferred_date = models.DateField()
    preferred_time = models.TimeField()
    reason = models.TextField(
        blank=True, help_text="Brief note on what the patient wants help with."
    )
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["patient", "status"]),
            models.Index(fields=["preferred_date"]),
        ]

    def __str__(self):
        return f"{self.patient} -> {self.doctor} on {self.preferred_date}"
