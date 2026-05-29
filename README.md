# NCRTC Bus Management System

A fleet management system for NCRTC's feeder bus network around the Delhi-NCR rapid-rail corridor.

Built as an internship assignment using Python + FastAPI + React + PostgreSQL.

---

## What it does

| Module | Description |
|--------|-------------|
| **Live Map (AVLS)** | Real-time map of all buses with 5-second updates. Click a vehicle to see driver, route, and path history. |
| **Scheduling** | Assign drivers to vehicles and routes. Publish duties. Drivers acknowledge their duty for the day. |
| **Incidents (IMS)** | Raise and track incidents from open to closed. Drivers have a panic button that creates a P1 alert instantly. |
| **Notices (CMS)** | Admin publishes notices to drivers. Track who has and hasn't read them. |

---

## Tech stack

- **Backend:** Python 3.11 + FastAPI + SQLAlchemy
- **Database:** PostgreSQL 16 + PostGIS
- **Frontend:** React + Vite + Leaflet (OpenStreetMap)
- **Auth:** JWT tokens + bcrypt password hashing
- **Infrastructure:** Docker Compose

---

## Quick start

### Prerequisites
- Docker Desktop installed and running
- That's it — nothing else needed

### Run the project

```bash
git clone <your-repo-url>
cd ncrtc-bms
docker compose up
```

Wait about 30 seconds for everything to start. You will see:ncrtc_backend  | Done! Database seeded successfully.
ncrtc_backend  | INFO: Application startup complete.
ncrtc_frontend | VITE ready in ...
ncrtc_tick     | GPS tick script started.

Then open **http://localhost:5173**

### Stop the project

```bash
docker compose down
```

---

## Demo credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Control Operator | `ctrl1` | `ctrl123` |
| Depot Manager | `mgr1` | `mgr123` |
| Driver | `driver1` | `driver123` |

> These are for demo purposes only.

---

## Demo flow

1. `docker compose up` on a fresh machine — everything starts, seed runs automatically
2. Log in as **admin** → create a notice, create a route
3. Log in as **mgr1** → assign a duty for today, publish it
4. Log in as **driver1** (resize browser to phone width) → see today's duty, acknowledge it, read the notice, tap the PANIC button
5. Log in as **ctrl1** → see the live map updating every 5 seconds, click a vehicle marker
6. Log in as **mgr1** → see the P1 incident in the list, open it, move it through the workflow
7. Go to History → pick a vehicle and today's date → see the trip path on the map

---

## Project structure
ncrtc-bms/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── database.py      # DB connection
│   │   ├── auth.py          # JWT + bcrypt helpers
│   │   ├── models/          # SQLAlchemy DB models (11 tables)
│   │   ├── schemas/         # Pydantic request/response shapes
│   │   ├── routers/         # One file per module (auth, avls, scheduling, ims, cms)
│   │   ├── services/        # Business logic
│   │   └── dependencies.py  # Auth middleware
│   ├── seed/
│   │   ├── seed.py          # Inserts all dummy data on startup
│   │   └── tick.py          # GPS simulation — moves vehicles every 5s
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # One folder per module
│   │   ├── api/             # Axios calls — one file per module
│   │   └── App.jsx          # Routing and auth state
│   └── Dockerfile
├── docker-compose.yml
└── README.md

---

## Notes on the GPS simulation

This project uses seeded dummy data. The `tick.py` script simulates live GPS by inserting one coordinate per vehicle every 5 seconds along pre-defined NCR routes.

In a production system this would be replaced by a TCP ingest service reading from real GPS devices feeding a message queue. The database schema and API are designed to support that — the `gps_pings` table structure is identical to what a real ingest pipeline would write.

---

## API documentation

Auto-generated API docs available at **http://localhost:8000/docs** when the project is running.
