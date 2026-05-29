# NCRTC BMS — Architecture Note

---

## 1. System Overview

The NCRTC Bus Management System is a web-based fleet operations platform for managing feeder buses around the Delhi-NCR rapid-rail corridor. It consists of four modules — live vehicle tracking (AVLS), duty scheduling, incident management (IMS), and notice publishing (CMS).

The system follows a standard three-tier architecture:

    Browser (React)  ──►  Backend (FastAPI)  ──►  Database (PostgreSQL)
    Driver PWA       ──►  REST API / JSON    ──►  PostGIS extensions

All communication happens over HTTP/JSON. There is no message queue, no microservices, and no separate ingest pipeline — this is intentional for a demo-scale system and is explained further in Section 4.

---

## 2. Module Breakdown

### AVLS — Automatic Vehicle Location System

The live map polls GET /api/v1/avls/live every 5 seconds. This endpoint runs a SQL query that returns the latest GPS ping per vehicle using a subquery with GROUP BY vehicle_id and MAX(ts). The result is rendered as Leaflet markers on an OpenStreetMap base layer.

Clicking a marker fetches the last 30 minutes of pings for that vehicle and draws them as a polyline. The history page queries all pings for a vehicle on a given date and draws the full day path.

GPS data is simulated by tick.py — a background Python script that inserts one coordinate per vehicle every 5 seconds along pre-defined NCR routes. On startup, tick.py reads vehicle IDs directly from the database so it always uses the correct IDs regardless of how many times the seed has run.

### Scheduling

The scheduling module manages the relationship between drivers, vehicles, routes, and dates. The core table is duty, which links a driver_id, vehicle_id, route_id, and date together with a status field (draft → published).

The roster view fetches all duties for a selected date and renders them in a table. A depot manager can only see duties for drivers in their own depot — this is enforced in the backend by filtering on depot_id. Once published, a duty appears in the driver's "My Duty" view, where they can acknowledge it. The ack_at timestamp is recorded when they do.

A conflict check prevents the same driver being assigned two duties on the same date — the backend returns HTTP 400 if a duplicate is detected before inserting.

### IMS — Incident Management System

Incidents follow a strict state machine:

    Open → Acknowledged → In Progress → Resolved → Closed

Each transition is stored as an incident_event row with the actor, timestamp, old status, new status, and a mandatory note. This creates a full audit trail visible as a timeline on the detail page.

The driver panic button creates a P1 incident automatically with the driver's current vehicle linked. Severity P1 means critical — visible at the top of the incident list and highlighted in red.

Depot managers see only incidents from their depot. Control operators and admins see all incidents.

### CMS — Content Management System

Notices are the simplest module. An admin creates a notice with a title, body, and audience (all drivers, or a specific depot). The notice is stored with a publish_at timestamp.

When a driver opens the notices page, the backend filters notices by audience and returns an is_read flag for each one by checking the notice_reads table. Tapping a notice inserts a notice_read row. The admin read receipt view shows which drivers have and have not read a given notice.

---

## 3. Database Design

The system uses 11 tables in PostgreSQL with PostGIS extensions for geographic data.

    depot            — depots with lat/lng location
    vehicle          — buses, each belonging to a depot
    user             — all users across all roles
    stop             — named bus stops with coordinates
    route            — named routes belonging to a depot
    route_stop       — ordered stops within a route with time offsets
    duty             — driver + vehicle + route + date assignment
    gps_ping         — vehicle location at a point in time
    incident         — raised issues with status and severity
    incident_event   — audit trail of every status change
    notice           — published messages from admin
    notice_read      — read receipts per driver per notice

Key design decisions:

- All tables use integer primary keys with auto-increment
- Depot scoping is enforced at the API layer, not the DB layer
- gps_ping is the highest-volume table — in production it would need a time-series index on (vehicle_id, ts DESC)
- notice_reads uses a composite approach — one row per driver per notice

---

## 4. What Would Be Different in Production

This project uses simulated data and a simplified architecture appropriate for a demo. A production deployment would differ in these ways:

**GPS Ingest**
tick.py writes directly to the database. In production, real GPS devices send UDP/TCP packets to a dedicated ingest service. That service would parse the device protocol, validate packets, and write to a message queue (e.g. Redis Streams or Kafka). A separate consumer would process the queue and write to the gps_pings table. This separation handles thousands of simultaneous device connections without blocking the main API.

**Live Updates**
The frontend currently polls every 5 seconds. In production, WebSockets would push updates to connected clients the moment a new ping arrives, reducing latency and unnecessary requests.

**Authentication**
JWT tokens are currently long-lived (24 hours). Production would use short-lived access tokens with refresh tokens, and store refresh tokens server-side for revocation.

**Scaling**
The current setup runs everything on one machine. Production would run the backend behind a load balancer with multiple instances, the database on a managed service (e.g. AWS RDS), and static assets on a CDN.

---

## 5. Known Limitations

- Photo upload on incidents is not implemented
- The depot filter dropdown on the live map is loaded from the API but depot names are fixed to the seeded data
- No automated test suite — manual testing only
- JWT secret is stored in docker-compose.yml as a plaintext environment variable — in production this would use a secrets manager

---

## 6. Libraries and Tools Used

| Tool | Purpose |
|------|---------|
| FastAPI | Backend framework — chosen for automatic API docs and Python type hints |
| SQLAlchemy | ORM — avoids raw SQL and handles migrations cleanly |
| bcrypt | Password hashing — industry standard, never stores plaintext |
| python-jose | JWT token creation and validation |
| React + Vite | Frontend — fast dev server, component-based UI |
| Leaflet + react-leaflet | Map rendering — free, no API key needed, good React integration |
| axios | HTTP client — cleaner than fetch for API calls |
| Docker Compose | One-command startup — ensures consistent environment across machines |
| PostgreSQL + PostGIS | Database — PostGIS adds geographic query support |