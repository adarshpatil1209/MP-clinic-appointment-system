import csv

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.http import HttpResponse

from .models import Appointment, Availability, DoctorProfile, Slot, StatusLog, User


@admin.action(description="Export selected to CSV")
def export_csv(modeladmin, request, qs):
    r = HttpResponse(content_type="text/csv")
    r["Content-Disposition"] = "attachment; filename=appointments.csv"
    w = csv.writer(r)
    w.writerow(["id", "patient", "doctor", "start", "status"])
    for a in qs.select_related("patient", "slot__doctor__user"):
        w.writerow(
            [a.id, a.patient.display_name, a.slot.doctor, a.slot.start.isoformat(), a.status]
        )
    return r


class LogInline(admin.TabularInline):
    model = StatusLog
    extra = 0
    can_delete = False
    readonly_fields = ["old_status", "new_status", "changed_by", "changed_at"]


@admin.register(User)
class MediUserAdmin(UserAdmin):
    list_display = ["username", "email", "role", "phone", "is_staff"]
    list_filter = ["role", "is_staff", "is_superuser"]
    search_fields = ["username", "email", "first_name", "last_name", "phone"]
    fieldsets = UserAdmin.fieldsets + (
        ("MediSlot", {"fields": ("role", "phone", "avatar_initials", "avatar")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("MediSlot", {"fields": ("role", "phone", "email")}),
    )


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["id", "patient", "slot", "status", "created_at"]
    list_filter = ["status", "slot__doctor"]
    search_fields = [
        "patient__username",
        "patient__first_name",
        "patient__last_name",
        "slot__doctor__user__first_name",
    ]
    date_hierarchy = "created_at"
    readonly_fields = ["created_at"]
    actions = [export_csv]
    inlines = [LogInline]
    list_select_related = ["patient", "slot__doctor__user"]


@admin.register(Slot)
class SlotAdmin(admin.ModelAdmin):
    list_display = ["doctor", "start", "end", "status"]
    list_filter = ["status", "doctor"]
    search_fields = ["doctor__user__username", "doctor__user__first_name"]
    date_hierarchy = "start"
    list_select_related = ["doctor__user"]


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "specialization", "fee", "experience_years", "approved"]
    list_filter = ["specialization", "approved"]
    search_fields = ["user__username", "user__first_name", "user__last_name"]
    list_editable = ["approved"]


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ["doctor", "weekday", "start_time", "end_time", "slot_minutes"]
    list_filter = ["weekday", "doctor"]
    search_fields = ["doctor__user__username"]


@admin.register(StatusLog)
class StatusLogAdmin(admin.ModelAdmin):
    list_display = ["appointment", "old_status", "new_status", "changed_by", "changed_at"]
    readonly_fields = ["appointment", "old_status", "new_status", "changed_by", "changed_at"]
    date_hierarchy = "changed_at"
    list_filter = ["new_status"]
    search_fields = ["appointment__id", "changed_by__username"]
