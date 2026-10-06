# MediSlot

A robust clinic appointment system built with Django, PostgreSQL, and Alpine.js. Designed for a 4-person college project, MediSlot handles real-time concurrency for bookings, ensuring zero double-bookings through database-level row locks.

## Core Features

- **Concurrency-Safe Booking**: Appointments use `select_for_update()` to handle race conditions safely. No double-bookings, even if two users click at the same millisecond.
- **Role-Based Access**: Specialized dashboards for Patients (discover doctors, book, cancel) and Doctors (manage availability, view queue, update statuses).
- **Idempotent Slot Generation**: Doctors define weekly availability rules, and a management command generates the actual time slots.
- **Modern UI**: Custom CSS token system, fully responsive, zero-dependency layout structure using Bootstrap grid, and reactive elements powered by Alpine.js.

## Tech Stack

- **Backend**: Django 5.x, Python 3.10+
- **Database**: PostgreSQL (Required for `select_for_update` row-locking)
- **Frontend**: HTML/CSS (Custom Tokens), Bootstrap 5 (Grid/Utils), Alpine.js (Lightweight reactivity)

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and update it with your database credentials.

```bash
cp .env.example .env
```
Ensure your local PostgreSQL instance is running and you have created a database named `medislot`.

### 2. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Database Migration & Seeding

Apply the migrations to setup the schema:

```bash
python manage.py migrate
```

Generate sample doctors, patients, and availability rules:

```bash
python manage.py seed
```

Generate the actual bookable slots for the upcoming weeks:

```bash
python manage.py generate_slots --days 14
```

*Note: You should run `generate_slots` periodically (e.g., via cron) to keep slots topped up.*

### 4. Run the Server

```bash
python manage.py runserver
```
Visit `http://localhost:8000`.

## Architecture Guide: Where Logic Lives

- **`core/models.py`**: Defines the schema. Status transition map (`TRANSITIONS`) lives here to guarantee state machine logic.
- **`core/services.py`**: Contains all critical business logic. Booking an appointment, cancelling, and updating statuses happen here. This keeps views thin and testable.
- **`core/views.py`**: Standard Django views. API endpoints for slots and booking return JSON to be consumed by Alpine.js.
- **`core/tests.py`**: Comprehensive test suite. Includes `TransactionTestCase` with Python threads to verify database row-locking behavior.
- **`templates/`**: HTML templates extending `base.html`.
- **`static/css/tokens.css`**: The design system. All colors, spacing, and typography are defined as CSS variables.
- **`static/js/app.js`**: Shared JavaScript functions and Alpine.js data components.

## Automated Tests

Run the test suite to verify business logic and concurrency locks:

```bash
python manage.py test core
```
