from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.forms import PasswordChangeForm as _PwChangeForm
from django.contrib.auth.forms import UserCreationForm

from .models import Availability, DoctorProfile, User


def _fc(extra=""):
    return {"class": f"form-control {extra}".strip()}


def _fs():
    return {"class": "form-select"}


class LoginForm(AuthenticationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].widget.attrs.update(
            {**_fc(), "placeholder": "username", "autocomplete": "username", "required": True}
        )
        self.fields["password"].widget.attrs.update(
            {**_fc(), "placeholder": "Password", "autocomplete": "current-password", "required": True}
        )


class RegisterForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(
            attrs={**_fc(), "placeholder": "you@example.com", "autocomplete": "email"}
        ),
        help_text="Required — used for appointment notifications.",
    )

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "username",
            "email",
            "phone",
            "role",
            "password1",
            "password2",
        ]
        widgets = {
            "first_name": forms.TextInput(attrs={**_fc(), "placeholder": "First name", "required": True}),
            "last_name": forms.TextInput(attrs={**_fc(), "placeholder": "Last name", "required": True}),
            "username": forms.TextInput(attrs={**_fc(), "placeholder": "username", "autocomplete": "username"}),
            "phone": forms.TextInput(attrs={**_fc(), "placeholder": "+91 98765 43210", "type": "tel"}),
            "role": forms.Select(attrs=_fs()),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["password1"].widget.attrs.update({**_fc(), "autocomplete": "new-password"})
        self.fields["password2"].widget.attrs.update({**_fc(), "autocomplete": "new-password"})
        self.fields["first_name"].required = True
        self.fields["last_name"].required = True

    def clean_email(self):
        email = self.cleaned_data["email"]
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email.lower()


class DoctorProfileForm(forms.ModelForm):
    avatar_initials = forms.CharField(
        required=False,
        max_length=4,
        label="Avatar initials",
        widget=forms.TextInput(attrs={**_fc(), "placeholder": "MI", "maxlength": "4"}),
        help_text="Two letters shown on your avatar. Leave blank to use your name.",
    )

    class Meta:
        model = DoctorProfile
        fields = ["specialization", "fee", "experience_years", "bio"]
        widgets = {
            "specialization": forms.TextInput(attrs=_fc()),
            "fee": forms.NumberInput(attrs={**_fc(), "min": 0, "step": 50}),
            "experience_years": forms.NumberInput(attrs={**_fc(), "min": 0, "max": 60}),
            "bio": forms.Textarea(
                attrs={**_fc(), "rows": 4, "placeholder": "A short bio visible to patients…"}
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and getattr(self.instance, "user_id", None):
            self.fields["avatar_initials"].initial = self.instance.user.avatar_initials

    def save(self, commit=True):
        doc = super().save(commit=commit)
        user = doc.user
        user.avatar_initials = (self.cleaned_data.get("avatar_initials") or "").strip().upper()
        if commit:
            user.save(update_fields=["avatar_initials"])
        return doc


class PatientProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone"]
        widgets = {
            "first_name": forms.TextInput(attrs=_fc()),
            "last_name": forms.TextInput(attrs=_fc()),
            "email": forms.EmailInput(attrs=_fc()),
            "phone": forms.TextInput(attrs={**_fc(), "type": "tel"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["first_name"].required = True
        self.fields["last_name"].required = True
        self.fields["email"].required = True

    def clean_email(self):
        email = self.cleaned_data["email"]
        qs = User.objects.filter(email__iexact=email).exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("Another account uses this email address.")
        return email.lower()


class PasswordChangeForm(_PwChangeForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for f in self.fields.values():
            f.widget.attrs.update(_fc())


class AvailabilityForm(forms.ModelForm):
    class Meta:
        model = Availability
        fields = ["weekday", "start_time", "end_time", "slot_minutes"]
        widgets = {
            "weekday": forms.Select(attrs=_fs()),
            "start_time": forms.TimeInput(attrs={**_fc(), "type": "time"}),
            "end_time": forms.TimeInput(attrs={**_fc(), "type": "time"}),
            "slot_minutes": forms.NumberInput(attrs={**_fc(), "min": 10, "max": 120, "step": 5}),
        }

    def clean(self):
        d = super().clean()
        if d.get("start_time") and d.get("end_time") and d["end_time"] <= d["start_time"]:
            raise forms.ValidationError("End time must be after start time.")
        if d.get("slot_minutes") and d["slot_minutes"] < 10:
            raise forms.ValidationError("Slots must be at least 10 minutes.")
        return d

    def validate_overlap(self, doctor, exclude_pk=None):
        weekday = self.cleaned_data.get("weekday")
        start = self.cleaned_data.get("start_time")
        end = self.cleaned_data.get("end_time")
        if weekday is None or not start or not end:
            return
        qs = Availability.objects.filter(doctor=doctor, weekday=weekday)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        for rule in qs:
            if start < rule.end_time and end > rule.start_time:
                raise forms.ValidationError(
                    f"This overlaps with an existing rule: "
                    f"{rule.start_time:%H:%M}–{rule.end_time:%H:%M} on {rule.get_weekday_display()}."
                )
