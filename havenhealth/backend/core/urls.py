from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("services", views.ServiceViewSet, basename="service")
router.register("doctors", views.DoctorViewSet, basename="doctor")
router.register("pricing-plans", views.PricingPlanViewSet, basename="pricingplan")
router.register("testimonials", views.TestimonialViewSet, basename="testimonial")
router.register("faqs", views.FAQViewSet, basename="faq")
router.register(
    "consultations", views.ConsultationRequestViewSet, basename="consultation"
)

urlpatterns = router.urls
