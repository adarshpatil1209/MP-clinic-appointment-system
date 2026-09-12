from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from .models import ConsultationRequest, FAQ, PricingPlan, Service, Testimonial, Doctor
from .serializers import (
    ConsultationRequestSerializer,
    DoctorSerializer,
    FAQSerializer,
    PricingPlanSerializer,
    ServiceSerializer,
    TestimonialSerializer,
)


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.AllowAny]


class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Doctor.objects.prefetch_related("services").all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]


class PricingPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PricingPlan.objects.all()
    serializer_class = PricingPlanSerializer
    permission_classes = [permissions.AllowAny]


class TestimonialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [permissions.AllowAny]


class FAQViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer
    permission_classes = [permissions.AllowAny]


class ConsultationRequestViewSet(viewsets.ModelViewSet):
    """Patients can create, view, and cancel their own consultation requests."""

    serializer_class = ConsultationRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return ConsultationRequest.objects.filter(
            patient=self.request.user
        ).select_related("doctor", "service")

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.patient_id != self.request.user.id:
            raise PermissionDenied("You can only modify your own requests.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.patient_id != self.request.user.id:
            raise PermissionDenied("You can only cancel your own requests.")
        instance.delete()
