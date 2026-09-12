from django.conf import settings
from django.db import models


class Profile(models.Model):
    """Extra patient-facing fields layered on top of Django's built-in User."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    phone_number = models.CharField(max_length=32, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile<{self.user.username}>"
