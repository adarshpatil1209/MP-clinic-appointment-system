# MediSlot — Clinic Appointment System

<p align="center">
  <strong>[ Django 6.1 ]</strong> &bull; 
  <strong>[ PostgreSQL 15+ ]</strong> &bull; 
  <strong>[ Alpine.js 3.x ]</strong> &bull; 
  <strong>[ Core Concurrency Engine ]</strong>
</p>

<p align="center">
  A high-concurrency, robust clinic appointment scheduling system engineered for production-grade reliability. Built as an advanced 4-person engineering capstone project, MediSlot neutralizes simultaneous scheduling collisions using isolated database-level transaction row blocks, guaranteeing true zero-double-booking state integrity.
</p>

---

## Quick Navigation
* [Core Architectural Pillars](#core-architectural-pillars)
* [System Feature Profiles](#system-feature-profiles)
* [Tech Stack Matrix](#tech-stack-matrix)
* [Project Directory Map](#project-directory-map)
* [Installation & Setup Step-by-Step](#installation--setup-step-by-step)
* [Concurrency Isolation Testing](#concurrency-isolation-testing)
* [Engineering Development Team](#engineering-development-team)

---

## Core Architectural Pillars

```text
       [ PATIENT CLICK ]               [ DOCTOR SETS RULES ]
               │                                  │
               ▼                                  ▼
   ┌───────────────────────┐          ┌───────────────────────┐
   │    Alpine.js Core     │          │  Idempotent Generator │
   └───────────┬───────────┘          └───────────┬───────────┘
               │ (JSON API)                       │ (Cron/Management)
               ▼                                  ▼
   ┌───────────────────────┐          ┌───────────────────────┐
   │   Django View Layer   │          │  Populate Time Slots  │
   └───────────┬───────────┘          └───────────┬───────────┘
               │                                  │
               ▼                                  ▼
   ┌──────────────────────────────────────────────────────────┐
   │                     PostgreSQL Engine                    │
   │   ⚡ SELECT_FOR_UPDATE() Row Lock prevents race condition│
   └──────────────────────────────────────────────────────────┘
```

---

## System Feature Profiles

### Concurrency Isolation Control
* **Row-Level Serialization:** Harnesses PostgreSQL explicit row-level locking via `select_for_update()` during the registration pipeline.
* **Race Condition Mitigation:** Eliminates double-booking states natively at the database engine tier, even when multiple HTTP client threads attempt to lease the identical minute index at the exact same millisecond.

### Decoupled Role Gateways
* **Patient Client Engine:** Intuitive matching vectors to filter specialist profiles by discipline, review available windows, track waiting queues, and self-cancel reservations.
* **Clinical Dashboard:** Specialized control panel for doctors to provision availability rules, track daily operational workloads, and mutate check-in statuses in real time.

### Automated Scheduling Horizons
* **Idempotent Generations:** Doctors build static operational availability parameters rather than manual entries.
* **Management Automation:** A backend script parses these structures to sequentially output pristine, unallocated database records for upcoming calendar horizons.

---

## Tech Stack Matrix

| Architectural Layer | Technology Implemented | Structural Purpose |
| :--- | :--- | :--- |
| **Backend Core** | Python 3.10+ / Django 6.1 | Handles MVC pipeline routing, core business models, and secure transaction blocks. |
| **Database Engine** | PostgreSQL | Critical production engine providing row-level locking capabilities. |
| **Client Interface** | Vanilla JS / Alpine.js | Low-overhead DOM reactivity keeping state updates fast without complex SPA setups. |
| **Design Framework** | Custom Design Tokens & Bootstrap 5 | Standardizes spacing variables (`tokens.css`) alongside a fluid grid. |

---

## Project Directory Map

```text
├── core/
│   ├── models.py              # Schema designs & the finite state-machine map (TRANSITIONS)
│   ├── services.py            # Isolated Business Logic Layer (Booking transactions, cancellations)
│   ├── views.py               # Lean request handlers returning clean HTML fragments & JSON data
│   └── tests.py               # Multi-threaded validation logic verifying lock execution
├── static/
│   ├── css/
│   │   ├── tokens.css         # Central Design Tokens (Global variables, color maps, fonts)
│   │   └── app.css            # Scoped structural design definitions
│   └── js/
│       └── app.js             # Alpine.js dynamic handlers & utility state variables
└── templates/                 # Decoupled component layers extending base layout wrappers
```

---

## Installation & Setup Step-by-Step

### 1. Environment Setup
Clone down the source code files locally, instantiate your system configuration file, and append your database credentials:
```bash
cp .env.example .env
```
*System Notice: Verify your local PostgreSQL service daemon is actively running and that a target database named `medislot` has been initialized before launching migrations.*

### 2. Dependency Allocation
Establish a clean local Python environment container and pull the structural module files:
```bash
python -m venv venv

# Linux / MacOS Activation:
source venv/bin/activate  

# Windows PowerShell Activation:
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 3. Schema Construction & Seeding
Execute database model construction, write developer seed models, and generate the upcoming appointment slots:
```bash
# Apply migrations to construct tables
python manage.py migrate

# Seed dummy patient profiles and doctor rosters
python manage.py seed

# Auto-generate bookable time slots for the next 14 days
python manage.py generate_slots --days 14
```
*Production Note: The `generate_slots` script should be tied directly to an asynchronous orchestrator or system cron process to continuously maintain bookable horizons.*

### 4. Ignite Development Server
Start the local network execution server:
```bash
python manage.py runserver
```
Launch your browser container and direct it to: `http://127.0.0.1:8000`

---

## Concurrency Isolation Testing

Run the automated verification suite to confirm transactional safety under load:
```bash
python manage.py test core
```
*The verification framework boots concurrent system execution threads inside a dedicated `TransactionTestCase` envelope to validate that your database locks safely handle simultaneous booking requests.*

---

## Engineering Development Team
Developed with absolute system integrity by:
* **Adarsh Patil** 
* **Sawan**
* **shilpa**
* **swara**
