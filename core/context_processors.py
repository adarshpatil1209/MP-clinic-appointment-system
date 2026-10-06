"""
Context processors that inject data into every template context.
"""
from django.conf import settings


def nav_context(request):
    return {"cancel_cutoff_hours": settings.CANCEL_CUTOFF_HOURS}
