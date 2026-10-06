from django.contrib.auth.views import LogoutView
from django.urls import path

from . import views as v

urlpatterns = [
    path("", v.landing, name="landing"),
    path("register/", v.register, name="register"),
    path("login/", v.MediLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("home/", v.home, name="home"),

    path("doctors/", v.doctors, name="doctors"),
    path("doctors/<int:pk>/", v.doctor_profile, name="doctor_profile"),

    path("api/doctors/<int:pk>/slots/", v.slots_api, name="slots_api"),
    path("api/book/", v.book_api, name="book_api"),

    path("appointments/", v.my_appointments, name="appointments"),
    path("appointments/<int:pk>/", v.appointment_detail, name="appointment_detail"),
    path("appointments/<int:pk>/cancel/", v.cancel, name="cancel"),

    path("profile/", v.patient_profile, name="patient_profile"),

    path("doctor/", v.dashboard, name="dashboard"),
    path("doctor/availability/", v.availability, name="availability"),
    path("doctor/settings/", v.doctor_settings, name="doctor_settings"),

    path("api/appointments/<int:pk>/status/", v.status_api, name="status_api"),
]
