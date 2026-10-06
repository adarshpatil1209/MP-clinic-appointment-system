from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Appointment, StatusLog


@receiver(pre_save, sender=Appointment)
def remember_old_status(sender, instance, **kw):
    old = sender.objects.filter(pk=instance.pk).values_list("status", flat=True).first() if instance.pk else None
    instance._old_status = old


@receiver(post_save, sender=Appointment)
def log_status_change(sender, instance, **kw):
    if instance._old_status != instance.status:   # audit trail on every change
        StatusLog.objects.create(appointment=instance, old_status=instance._old_status or "",
                                 new_status=instance.status, changed_by=getattr(instance, "_by", None))
