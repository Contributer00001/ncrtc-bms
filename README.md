# NCRTC Bus Management System

A fleet management system for NCRTC's feeder bus network around the Delhi-NCR rapid-rail corridor.
Built as an internship assignment using Python + FastAPI + React + PostgreSQL.

---

## What it does

| Module | Description |
|--------|-------------|
| **Live Map (AVLS)** | Real-time map of all buses with 5-second updates. Click a vehicle to see driver, route, and path. |
| **Scheduling** | Assign drivers to vehicles and routes. Publish duties. Drivers acknowledge their duty. |
| **Incidents (IMS)** | Raise and track incidents from open to closed. Panic button creates a P1 alert instantly. |
| **Notices (CMS)** | Admin publishes notices to drivers. Track who has and hasn't read them. |

---

## Tech Stack

- **Backend:** Python 3.11 + FastAPI + SQLAlchemy
- **Database:** PostgreSQL 16 + PostGIS
- **Frontend:** React + Vite + Leaflet (OpenStreetMap)
- **Auth:** JWT tokens + bcrypt password hashing
- **Infrastructure:** Docker Compose

---

## Quick Start

**Prerequisites:** Docker Desktop installed and running. That is it.

    git clone <your-repo-url>
    cd ncrtc-bms
    docker compose up

Wait about 30 seconds. Then open http://localhost:5173

To stop:

    docker compose down

---

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Control Operator | ctrl1 | ctrl123 |
| Depot Manager | mgr1 | mgr123 |
| Driver | driver1 | driver123 |

For demo purposes only.

---

## Demo Flow

1. Run docker compose up — everything starts, seed runs automatically
2. Log in as admin — create a notice, create a route
3. Log in as mgr1 — assign a duty for today, publish it
4. Log in as driver1 — see today's duty, acknowledge it, read the notice, tap the PANIC button
5. Log in as ctrl1 — see the live map updating every 5 seconds, click a vehicle marker
6. Log in as mgr1 — see the P1 incident, open it, move it through the workflow
7. Go to History — pick a vehicle and today's date to see the trip path

---

## Project Structure

    ncrtc-bms/
    ├── backend/
    │   ├── app/
    │   │   ├── main.py          — FastAPI entry point
    │   │   ├── database.py      — DB connection
    │   │   ├── auth.py          — JWT and bcrypt helpers
    │   │   ├── models/          — 11 database tables
    │   │   ├── routers/         — auth, avls, scheduling, ims, cms
    │   │   └── dependencies.py  — auth middleware
    │   ├── seed/
    │   │   ├── seed.py          — inserts dummy data on startup
    │   │   └── tick.py          — moves vehicles every 5 seconds
    │   └── Dockerfile
    ├── frontend/
    │   ├── src/
    │   │   ├── pages/           — one folder per module
    │   │   └── api/             — axios calls per module
    │   └── Dockerfile
    ├── docker-compose.yml
    └── README.md

---

## GPS Simulation Note

This project uses seeded dummy data. The tick.py script simulates live GPS by inserting one coordinate per vehicle every 5 seconds along pre-defined NCR routes.

In production this would be replaced by a TCP ingest service reading from real GPS devices. The database schema and API are designed to support that — the gps_pings table structure is identical to what a real ingest pipeline would write.

---

## API Docs

Available at http://localhost:8000/docs when the project is running.