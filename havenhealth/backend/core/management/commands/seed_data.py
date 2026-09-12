from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from core.models import Doctor, FAQ, PricingPlan, Service, Testimonial


SERVICES = [
    {
        "name": "Cardiology",
        "icon": "heart-pulse",
        "short_description": "Heart health checks, monitoring, and long-term care plans.",
        "description": (
            "Our cardiology team tracks blood pressure, cholesterol, and heart "
            "rhythm over time so small risks get caught long before they become "
            "emergencies."
        ),
        "accent": "teal",
        "is_featured": True,
    },
    {
        "name": "Mental Wellness",
        "icon": "brain",
        "short_description": "Confidential therapy and psychiatric support, on your schedule.",
        "description": (
            "Talk to a licensed therapist or psychiatrist from home. We cover "
            "anxiety, depression, burnout, and everyday stress with sessions "
            "that fit around your week."
        ),
        "accent": "amber",
        "is_featured": True,
    },
    {
        "name": "Dental Care",
        "icon": "tooth",
        "short_description": "Routine check-ups, cleanings, and cosmetic consultations.",
        "description": (
            "From a six-month cleaning to a full cosmetic consultation, our "
            "dental partners handle it with same-week scheduling."
        ),
        "accent": "sky",
        "is_featured": False,
    },
    {
        "name": "Preventive Checkups",
        "icon": "clipboard-check",
        "short_description": "Annual physicals and screening panels that catch issues early.",
        "description": (
            "A yearly checkup is the cheapest insurance you can buy. We bundle "
            "bloodwork, vitals, and a doctor review into one visit."
        ),
        "accent": "teal",
        "is_featured": False,
    },
    {
        "name": "Dermatology",
        "icon": "sparkles",
        "short_description": "Skin checks, acne treatment, and mole screening.",
        "description": (
            "Send photos ahead of your visit and get a treatment plan the same "
            "day for most common skin concerns."
        ),
        "accent": "amber",
        "is_featured": False,
    },
    {
        "name": "Nutrition Coaching",
        "icon": "apple",
        "short_description": "Personalized eating plans built around your labs, not fads.",
        "description": (
            "A registered dietitian reviews your bloodwork and goals, then "
            "builds a plan you'll actually stick to."
        ),
        "accent": "sky",
        "is_featured": False,
    },
]

DOCTORS = [
    {
        "full_name": "Amara Okafor",
        "specialty": "Cardiologist",
        "bio": "15 years treating hypertension and arrhythmia across three hospital systems.",
        "years_experience": 15,
        "rating": "4.9",
        "patients_helped": 3200,
        "availability": Doctor.Availability.AVAILABLE_NOW,
        "photo_url": "",
        "services": ["Cardiology", "Preventive Checkups"],
    },
    {
        "full_name": "Daniel Reyes",
        "specialty": "Psychiatrist",
        "bio": "Specializes in anxiety, mood disorders, and medication management.",
        "years_experience": 9,
        "rating": "4.8",
        "patients_helped": 1800,
        "availability": Doctor.Availability.TODAY,
        "photo_url": "",
        "services": ["Mental Wellness"],
    },
    {
        "full_name": "Priya Nair",
        "specialty": "General Dentist",
        "bio": "Focused on gentle, judgment-free preventive dental care for families.",
        "years_experience": 11,
        "rating": "4.9",
        "patients_helped": 4100,
        "availability": Doctor.Availability.TODAY,
        "photo_url": "",
        "services": ["Dental Care"],
    },
    {
        "full_name": "Marcus Bell",
        "specialty": "Family Medicine",
        "bio": "Runs annual physicals and preventive screening for patients of all ages.",
        "years_experience": 13,
        "rating": "4.7",
        "patients_helped": 5000,
        "availability": Doctor.Availability.AVAILABLE_NOW,
        "photo_url": "",
        "services": ["Preventive Checkups", "Nutrition Coaching"],
    },
    {
        "full_name": "Elena Vasquez",
        "specialty": "Dermatologist",
        "bio": "Sees everything from routine mole checks to complex acne cases.",
        "years_experience": 7,
        "rating": "4.8",
        "patients_helped": 1500,
        "availability": Doctor.Availability.BOOKED,
        "photo_url": "",
        "services": ["Dermatology"],
    },
    {
        "full_name": "Jonah Fischer",
        "specialty": "Registered Dietitian",
        "bio": "Builds nutrition plans around lab work rather than trends.",
        "years_experience": 6,
        "rating": "4.9",
        "patients_helped": 900,
        "availability": Doctor.Availability.TODAY,
        "photo_url": "",
        "services": ["Nutrition Coaching"],
    },
]

PRICING_PLANS = [
    {
        "name": "Essential",
        "price_per_month": "0.00",
        "tagline": "Pay per visit, no commitment.",
        "features": [
            "Book any available doctor",
            "Secure messaging after visits",
            "Digital visit summaries",
        ],
        "is_highlighted": False,
    },
    {
        "name": "Plus",
        "price_per_month": "29.00",
        "tagline": "For anyone managing an ongoing condition.",
        "features": [
            "Everything in Essential",
            "Priority scheduling within 24 hours",
            "Unlimited secure messaging",
            "Quarterly care plan review",
        ],
        "is_highlighted": True,
    },
    {
        "name": "Family",
        "price_per_month": "59.00",
        "tagline": "Coverage for up to 5 people on one account.",
        "features": [
            "Everything in Plus",
            "Up to 5 linked profiles",
            "Shared care coordination",
            "Dedicated family health advisor",
        ],
        "is_highlighted": False,
    },
]

TESTIMONIALS = [
    {
        "author_name": "Sophie Turner",
        "author_role": "Plus member since 2024",
        "quote": (
            "I booked a same-day video visit for my daughter's fever and had a "
            "prescription sent to our pharmacy within the hour."
        ),
    },
    {
        "author_name": "Michael Johnson",
        "author_role": "Family plan member",
        "quote": (
            "Having one place to track checkups for all four of us has cut our "
            "no-shows to basically zero."
        ),
    },
    {
        "author_name": "Aisha Rahman",
        "author_role": "Essential member",
        "quote": (
            "The mental wellness sessions fit around my work schedule in a way "
            "no clinic near me ever could."
        ),
    },
]

FAQS = [
    {
        "question": "How do I create an account?",
        "answer": (
            "Select Sign up, add your name, email, and a password, and you're "
            "in. No insurance card required to get started."
        ),
    },
    {
        "question": "What types of health services are available?",
        "answer": (
            "Cardiology, mental wellness, dental care, preventive checkups, "
            "dermatology, and nutrition coaching, with more specialties added "
            "regularly."
        ),
    },
    {
        "question": "How does booking work?",
        "answer": (
            "Pick a service, choose an available doctor, and select a date and "
            "time. You'll get a confirmation as soon as the doctor accepts."
        ),
    },
    {
        "question": "Can I cancel or reschedule a consultation?",
        "answer": (
            "Yes. Open the request from your dashboard and cancel it any time "
            "before the appointment starts."
        ),
    },
    {
        "question": "Is my information kept private?",
        "answer": (
            "Your visit history and messages are only visible to you and the "
            "care team you choose to see."
        ),
    },
]


class Command(BaseCommand):
    help = "Seed the database with demo services, doctors, plans, and a demo login."

    def handle(self, *args, **options):
        service_objs = {}
        for data in SERVICES:
            service, _ = Service.objects.update_or_create(
                slug=slugify(data["name"]),
                defaults={**data, "slug": slugify(data["name"])},
            )
            service_objs[data["name"]] = service
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(SERVICES)} services"))

        for data in DOCTORS:
            service_names = data.pop("services")
            doctor, _ = Doctor.objects.update_or_create(
                full_name=data["full_name"], defaults=data
            )
            doctor.services.set([service_objs[name] for name in service_names])
            data["services"] = service_names
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(DOCTORS)} doctors"))

        for data in PRICING_PLANS:
            PricingPlan.objects.update_or_create(
                name=data["name"], defaults=data
            )
        self.stdout.write(
            self.style.SUCCESS(f"Seeded {len(PRICING_PLANS)} pricing plans")
        )

        for data in TESTIMONIALS:
            Testimonial.objects.update_or_create(
                author_name=data["author_name"], defaults=data
            )
        self.stdout.write(
            self.style.SUCCESS(f"Seeded {len(TESTIMONIALS)} testimonials")
        )

        for data in FAQS:
            FAQ.objects.update_or_create(question=data["question"], defaults=data)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(FAQS)} FAQs"))

        if not User.objects.filter(username="demo").exists():
            demo = User.objects.create_user(
                username="demo",
                email="demo@havenhealth.app",
                password="demopass123",
                first_name="Demo",
                last_name="Patient",
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created demo login -> username: demo / password: demopass123"
                )
            )
        else:
            self.stdout.write("Demo user already exists, skipping.")

        self.stdout.write(self.style.SUCCESS("Seed complete."))
