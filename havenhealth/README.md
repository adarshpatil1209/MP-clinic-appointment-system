# Haven Health

A full-stack healthcare consultation booking platform. React/Vite/Tailwind frontend, Django + Django REST Framework backend, SQLite for development.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router, lucide-react
- **Backend:** Django 6, Django REST Framework, django-cors-headers
- **Database:** SQLite (dev) — models are plain Django ORM, so switching `DATABASES` to PostgreSQL in `backend/config/settings.py` is a drop-in change
- **Auth:** Django session authentication (login/register/logout/me endpoints), CSRF-protected

## Project structure

```
havenhealth/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/          # settings, root urls
│   ├── accounts/        # auth: register/login/logout/me, Profile model
│   └── core/            # Service, Doctor, PricingPlan, Testimonial, FAQ,
│                         # ConsultationRequest models + API + seed command
├── frontend/
│   ├── src/
│   │   ├── api/         # fetch client with CSRF handling
│   │   ├── context/      # AuthContext
│   │   ├── components/   # Navbar, Hero, section components, UI primitives
│   │   └── pages/        # Landing, Login, Register, Dashboard
│   └── vite.config.js    # proxies /api to the Django dev server
└── README.md
```

## Run it

### 1. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

The API is now at `http://127.0.0.1:8000/api/`. Admin panel at `/admin/`.

**Demo login created by the seed command:** `demo` / `demopass123`
**Superuser (create your own if you like):**
```bash
python manage.py createsuperuser
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to `http://127.0.0.1:8000`, so cookies/CSRF work automatically — no extra configuration needed.

### 3. Production build

```bash
cd frontend
npm run build
```

Outputs static assets to `frontend/dist/`, which you can serve from any static host or from Django's `staticfiles` in a production deployment (a reverse proxy or WhiteNoise setup is recommended).

## What's implemented

- **Auth:** register, login, logout, "who am I" — Django session cookies + CSRF token, enforced on every mutating request
- **API:** `/api/services/`, `/api/doctors/`, `/api/pricing-plans/`, `/api/testimonials/`, `/api/faqs/` (public, read-only) and `/api/consultations/` (authenticated, scoped to the logged-in patient — create, list, cancel)
- **Validation:** server-side (can't book a doctor who's fully booked, can't pick a past date, password confirmation, duplicate username/email checks) and client-side form validation with inline error messages
- **Frontend:** fully responsive landing page (hero, services, doctors, pricing, testimonials, FAQ accordion), auth pages, and a patient dashboard to book and cancel consultations — all backed by real API calls, with loading/error/empty states throughout
- **Admin:** every model is registered in Django admin for easy content management
- **Seed data:** 6 services, 6 doctors, 3 pricing plans, 3 testimonials, 5 FAQs, and a demo user, created via `python manage.py seed_data` (safe to re-run — it upserts)

## Notes for going to production

- Set `DJANGO_DEBUG=False` and a real `DJANGO_SECRET_KEY` environment variable
- Point `DATABASES` at PostgreSQL and add `psycopg2-binary` to `requirements.txt`
- Update `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` in `backend/config/settings.py` to your real frontend domain
- Build the frontend (`npm run build`) and serve `frontend/dist/` behind the same domain/reverse proxy as the API to keep cookie-based auth simple
