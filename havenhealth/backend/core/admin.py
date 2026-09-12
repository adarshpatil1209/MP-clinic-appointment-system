from django.contrib import admin

from .models import ConsultationRequest, Doctor, FAQ, PricingPlan, Service, Testimonial


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["name", "accent", "is_featured", "order"]
    list_editable = ["order", "is_featured"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ["full_name", "specialty", "availability", "rating", "order"]
    list_editable = ["order"]
    filter_horizontal = ["services"]


@admin.register(PricingPlan)
class PricingPlanAdmin(admin.ModelAdmin):
    list_display = ["name", "price_per_month", "is_highlighted", "order"]


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ["author_name", "author_role", "order"]


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ["question", "order"]


@admin.register(ConsultationRequest)
class ConsultationRequestAdmin(admin.ModelAdmin):
    list_display = [
        "patient",
        "doctor",
        "service",
        "preferred_date",
        "preferred_time",
        "status",
    ]
    list_filter = ["status", "consultation_type"]
    search_fields = ["patient__username", "doctor__full_name"]
