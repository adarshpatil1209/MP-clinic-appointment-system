from django.utils import timezone
from rest_framework import serializers

from .models import (
    ConsultationRequest,
    Doctor,
    FAQ,
    PricingPlan,
    Service,
    Testimonial,
)


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "slug",
            "icon",
            "short_description",
            "description",
            "accent",
            "is_featured",
        ]


class DoctorSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = [
            "id",
            "full_name",
            "specialty",
            "services",
            "bio",
            "years_experience",
            "rating",
            "patients_helped",
            "availability",
            "photo_url",
        ]


class PricingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = [
            "id",
            "name",
            "price_per_month",
            "tagline",
            "features",
            "is_highlighted",
        ]


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ["id", "author_name", "author_role", "quote", "avatar_url"]


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ["id", "question", "answer"]


class ConsultationRequestSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.full_name", read_only=True)
    service_name = serializers.CharField(
        source="service.name", read_only=True, default=None
    )

    class Meta:
        model = ConsultationRequest
        fields = [
            "id",
            "doctor",
            "doctor_name",
            "service",
            "service_name",
            "consultation_type",
            "preferred_date",
            "preferred_time",
            "reason",
            "status",
            "created_at",
        ]
        read_only_fields = ["status", "created_at"]

    def validate_preferred_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError(
                "Preferred date can't be in the past."
            )
        return value

    def validate_doctor(self, value):
        if value.availability == Doctor.Availability.BOOKED:
            raise serializers.ValidationError(
                "This doctor is fully booked right now. Please choose another."
            )
        return value

    def create(self, validated_data):
        validated_data["patient"] = self.context["request"].user
        return super().create(validated_data)
