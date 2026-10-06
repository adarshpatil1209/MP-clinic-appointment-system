# MediSlot — Clinic Appointment System

[![Django Version](https://shields.io)](https://djangoproject.com)
[![PostgreSQL](https://shields.io)](https://postgresql.org)
[![Alpine.js](https://shields.io)](https://alpinejs.dev)
[![License](https://shields.io)](https://github.com)

MediSlot is a high-concurrency, robust clinic appointment scheduling system built for modern medical environments. Designed as a 4-person engineering college capstone project, it handles high-volume booking traffic without allowing double-bookings, backed by strict database-level row isolation and transactional state rules.

---

## Core Features

### Concurrency-Safe Bookings
* Leverages PostgreSQL explicit row-level locking via `select_for_update()`.
* Guarantees zero double-bookings even if multiple patients attempt to claim the exact same time slot at the identical millisecond.

### Role-Based Dynamic Access
* **Patient Hub:** Discover available specialists, manage real-time queues, and book or cancel slots.
* **Doctor Dashboard:** Set availability rules, track upcoming daily queues, and modify clinical status variations instantly.

### Idempotent Slot Generation Engine
* Systemized scheduling architecture where doctors input general availability templates.
* An optimized background management command processes the templates to render real-time bookable slots sequentially.

### Tokenized UI Architecture
* Crafted on a decoupled architecture featuring a custom CSS token design system (`tokens.css`).
* Fully responsive layout structure leveraging Bootstrap 5 Grid for the structural skeleton and Alpine.js for low-latency reactive client interactions.

---

## Tech Stack Matrix

| Architecture Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.10+ / Django 6.1 | MVC engine, database transaction controls, and core controllers. |
| **Database Engine** | PostgreSQL | Essential production-ready engine required to support sequential row-locking blocks. |
| **Client Reactivity** | Vanilla JavaScript / Alpine.js | Lightweight DOM management without the overhead of heavy SPA frameworks. |
| **Design System** | Custom Utility CSS & Bootstrap 5 | Uniform color variables, design tokens, and fluid layout grids. |

---

## Project Structure Guide

```text
├── core/
│   ├── models.py              # Database Schema & State-Machine Transition Rules (TRANSITIONS)
│   ├── services.py            # Isolated Business Logic Layer (Booking, Canceling, Mutations)
│   ├── views.py               # Lean request handlers exposing HTML & JSON API endpoints
│   └── tests.py               # Multithreaded TransactionTestCase suites validating locks
├── static/
│   ├── css/
│   │   ├── tokens.css         # Central Design Tokens (Colors, variables, typography)
│   │   └── app.css            # Component-level layout modifiers
│   └── js/
│       └── app.js             # Reactive Alpine.js operations & shared utility hooks
└── templates/                 # Decoupled semantic HTML5 partials extending base templates
```

---

## Installation and Setup

### 1. Environment Configuration
Clone the repository, create your local configuration environment, and adjust the variables to align with your setup credentials:
```bash
cp .env.example .env
```
*Note: Ensure your local PostgreSQL server instance is running and that you have provisioned an empty database schema named `medislot` before continuing.*

### 2. Install Project Dependencies
Spin up a fresh Python virtual environment and install the required modules:
```bash
python -m venv venv

# On macOS/Linux:
source venv/bin/activate  

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 3. Database Initialization & Seeding
Run structural schema builds, deploy base seed models, and generate the scheduling horizons:
```bash
# Compile and run core schemas
python manage.py migrate

# Seed dummy doctors, patient records, and base rules
python manage.py seed

# Auto-generate actual bookable calendar slots for the next 14 days
python manage.py generate_slots --days 14
```
*Production Deployment Note: The `generate_slots` script is designed to run asynchronously through an automated worker task or cron runner to maintain future slot availability seamlessly.*

### 4. Run the Development Server
Boot the Django local execution process:
```bash
python manage.py runserver
```
Open your browser and navigate directly to: `http://127.0.0.1:8000`

---

## Automated Verification Testing

Verify structural isolation and database thread locking by running the local test utility:
```bash
python manage.py test core
```
*The test framework initiates parallel Python runtime threads executing concurrent booking workloads inside a comprehensive `TransactionTestCase` sequence to confirm lock execution safety under load.*

---

## Development Team
Developed as an engineering project by:
* **Adarsh Patil** — *Lead Developer / Repository Maintainer* — [@adarshpatil1209](https://github.com)
* *Project Team Member 2*
* *Project Team Member 3*
* *Project Team Member 4*
