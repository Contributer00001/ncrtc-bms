import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.models import Base, Depot, Vehicle, User, Stop, Route, RouteStop, Duty, GpsPing, Incident, IncidentEvent, Notice, NoticeRead
from datetime import date, datetime, timedelta
import bcrypt

def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def seed():
    db = SessionLocal()

    print("Clearing old data...")
    # Always delete child tables before parent tables
    db.query(NoticeRead).delete()
    db.query(Notice).delete()
    db.query(IncidentEvent).delete()
    db.query(Incident).delete()
    db.query(GpsPing).delete()       # must be before vehicles
    db.query(Duty).delete()
    db.query(RouteStop).delete()
    db.query(Route).delete()
    db.query(Stop).delete()
    db.query(Vehicle).delete()       # now safe
    db.query(User).delete()
    db.query(Depot).delete()
    db.commit()

    print("Seeding depots...")
    depots = [
        Depot(code="ANAND", name="Anand Vihar Depot",     location_lat=28.6469, location_lng=77.3160),
        Depot(code="NOIDA", name="Noida Sector 37 Depot", location_lat=28.5672, location_lng=77.3210),
        Depot(code="GHAZ",  name="Ghaziabad Depot",       location_lat=28.6692, location_lng=77.4538),
    ]
    db.add_all(depots)
    db.commit()

    print("Seeding users...")
    users = [
        User(username="admin",   password_hash=hash_password("admin123"),  full_name="Admin User",       role="admin",            depot_id=None),
        User(username="ctrl1",   password_hash=hash_password("ctrl123"),   full_name="Control Operator", role="control_operator", depot_id=None),
        User(username="mgr1",    password_hash=hash_password("mgr123"),    full_name="Anand Mgr",        role="depot_manager",    depot_id=depots[0].id),
        User(username="mgr2",    password_hash=hash_password("mgr123"),    full_name="Noida Mgr",        role="depot_manager",    depot_id=depots[1].id),
        User(username="driver1", password_hash=hash_password("driver123"), full_name="Ramesh Kumar",     role="driver",           depot_id=depots[0].id, phone="9811001001"),
        User(username="driver2", password_hash=hash_password("driver123"), full_name="Suresh Singh",     role="driver",           depot_id=depots[0].id, phone="9811001002"),
        User(username="driver3", password_hash=hash_password("driver123"), full_name="Amit Sharma",      role="driver",           depot_id=depots[1].id, phone="9811001003"),
        User(username="driver4", password_hash=hash_password("driver123"), full_name="Vijay Yadav",      role="driver",           depot_id=depots[1].id, phone="9811001004"),
        User(username="driver5", password_hash=hash_password("driver123"), full_name="Manoj Tiwari",     role="driver",           depot_id=depots[2].id, phone="9811001005"),
    ]
    db.add_all(users)
    db.commit()

    print("Seeding vehicles...")
    vehicles = [
        Vehicle(reg_no="DL1PC0001",  depot_id=depots[0].id, status="active"),
        Vehicle(reg_no="DL1PC0002",  depot_id=depots[0].id, status="active"),
        Vehicle(reg_no="UP14AB1001", depot_id=depots[1].id, status="active"),
        Vehicle(reg_no="UP14AB1002", depot_id=depots[1].id, status="active"),
        Vehicle(reg_no="UP14AB1003", depot_id=depots[1].id, status="active"),
        Vehicle(reg_no="UP80CD2001", depot_id=depots[2].id, status="active"),
    ]
    db.add_all(vehicles)
    db.commit()

    print("Seeding stops...")
    stops = [
        Stop(name="Anand Vihar ISBT",      lat=28.6469, lng=77.3160),
        Stop(name="Kaushambi",             lat=28.6412, lng=77.3178),
        Stop(name="Vaishali Sec 4",        lat=28.6445, lng=77.3345),
        Stop(name="Noida Sec 37",          lat=28.5672, lng=77.3210),
        Stop(name="Noida Sec 18",          lat=28.5705, lng=77.3260),
        Stop(name="Botanical Garden",      lat=28.5620, lng=77.3380),
        Stop(name="Ghaziabad Railway Stn", lat=28.6692, lng=77.4538),
        Stop(name="Raj Nagar",             lat=28.6730, lng=77.4420),
    ]
    db.add_all(stops)
    db.commit()

    print("Seeding routes...")
    routes = [
        Route(code="R01", name="Anand Vihar — Vaishali",          depot_id=depots[0].id),
        Route(code="R02", name="Noida Sec 37 — Botanical Garden", depot_id=depots[1].id),
        Route(code="R03", name="Ghaziabad Stn — Raj Nagar",       depot_id=depots[2].id),
    ]
    db.add_all(routes)
    db.commit()

    route_stop_data = [
        RouteStop(route_id=routes[0].id, stop_id=stops[0].id, sequence=1, planned_offset_min=0),
        RouteStop(route_id=routes[0].id, stop_id=stops[1].id, sequence=2, planned_offset_min=10),
        RouteStop(route_id=routes[0].id, stop_id=stops[2].id, sequence=3, planned_offset_min=20),
        RouteStop(route_id=routes[1].id, stop_id=stops[3].id, sequence=1, planned_offset_min=0),
        RouteStop(route_id=routes[1].id, stop_id=stops[4].id, sequence=2, planned_offset_min=8),
        RouteStop(route_id=routes[1].id, stop_id=stops[5].id, sequence=3, planned_offset_min=18),
        RouteStop(route_id=routes[2].id, stop_id=stops[6].id, sequence=1, planned_offset_min=0),
        RouteStop(route_id=routes[2].id, stop_id=stops[7].id, sequence=2, planned_offset_min=12),
    ]
    db.add_all(route_stop_data)
    db.commit()

    print("Seeding duties...")
    today = date.today()
    duties = [
        Duty(date=today, vehicle_id=vehicles[0].id, driver_id=users[4].id, route_id=routes[0].id, start_time="08:00", end_time="12:00", status="published"),
        Duty(date=today, vehicle_id=vehicles[1].id, driver_id=users[5].id, route_id=routes[0].id, start_time="12:00", end_time="16:00", status="published"),
        Duty(date=today, vehicle_id=vehicles[2].id, driver_id=users[6].id, route_id=routes[1].id, start_time="08:00", end_time="12:00", status="published"),
        Duty(date=today, vehicle_id=vehicles[3].id, driver_id=users[7].id, route_id=routes[1].id, start_time="13:00", end_time="17:00", status="draft"),
        Duty(date=today, vehicle_id=vehicles[5].id, driver_id=users[8].id, route_id=routes[2].id, start_time="09:00", end_time="13:00", status="published"),
    ]
    db.add_all(duties)
    db.commit()

    print("Seeding GPS pings...")
    gps_coords = [
        (28.6469, 77.3160), (28.6458, 77.3168), (28.6447, 77.3172),
        (28.6440, 77.3175), (28.6435, 77.3177), (28.6425, 77.3178),
        (28.6415, 77.3179), (28.6412, 77.3178), (28.6420, 77.3200),
        (28.6428, 77.3220), (28.6435, 77.3245), (28.6440, 77.3270),
        (28.6443, 77.3295), (28.6445, 77.3320), (28.6445, 77.3345),
    ]
    base_time = datetime.utcnow() - timedelta(minutes=len(gps_coords) * 2)
    for i, (lat, lng) in enumerate(gps_coords):
        db.add(GpsPing(
            vehicle_id=vehicles[0].id,
            ts=base_time + timedelta(minutes=i * 2),
            lat=lat, lng=lng,
            speed_kmh=30 + (i % 5) * 3,
            ignition_on=True
        ))
    db.commit()

    print("Seeding notices...")
    notices = [
        Notice(title="Route change on R01 tomorrow", body="Due to road work, R01 will skip Kaushambi stop tomorrow morning.", audience="all", created_by=users[0].id),
        Notice(title="New uniform policy",            body="All drivers must wear the new uniform from Monday onwards.",        audience="all", created_by=users[0].id),
    ]
    db.add_all(notices)
    db.commit()

    print("Seeding incidents...")
    incidents = [
        Incident(type="breakdown", severity="P2", status="open",        raised_by=users[4].id, depot_id=depots[0].id, vehicle_id=vehicles[0].id, description="Vehicle engine overheating near Kaushambi stop.",  created_at=datetime.utcnow() - timedelta(hours=3)),
        Incident(type="complaint", severity="P3", status="resolved",    raised_by=users[5].id, depot_id=depots[0].id, vehicle_id=vehicles[1].id, description="Passenger complained about rude behaviour.",        created_at=datetime.utcnow() - timedelta(hours=10), resolved_at=datetime.utcnow() - timedelta(hours=1)),
        Incident(type="accident",  severity="P1", status="in_progress", raised_by=users[6].id, depot_id=depots[1].id, vehicle_id=vehicles[2].id, description="Minor collision at Noida Sec 18 crossing.",         created_at=datetime.utcnow() - timedelta(hours=1)),
    ]
    db.add_all(incidents)
    db.commit()

    db.add(IncidentEvent(incident_id=incidents[0].id, ts=datetime.utcnow() - timedelta(hours=3),    actor_id=users[4].id, from_status=None,           to_status="open",         note="Incident raised"))
    db.add(IncidentEvent(incident_id=incidents[1].id, ts=datetime.utcnow() - timedelta(hours=10),   actor_id=users[5].id, from_status=None,           to_status="open",         note="Incident raised"))
    db.add(IncidentEvent(incident_id=incidents[1].id, ts=datetime.utcnow() - timedelta(hours=8),    actor_id=users[2].id, from_status="open",         to_status="acknowledged", note="Looking into it"))
    db.add(IncidentEvent(incident_id=incidents[1].id, ts=datetime.utcnow() - timedelta(hours=1),    actor_id=users[2].id, from_status="acknowledged", to_status="resolved",     note="Driver counselled"))
    db.add(IncidentEvent(incident_id=incidents[2].id, ts=datetime.utcnow() - timedelta(hours=1),    actor_id=users[6].id, from_status=None,           to_status="open",         note="Incident raised"))
    db.add(IncidentEvent(incident_id=incidents[2].id, ts=datetime.utcnow() - timedelta(minutes=30), actor_id=users[3].id, from_status="open",         to_status="in_progress",  note="Police notified, team dispatched"))
    db.commit()

    db.close()
    print("Done! Database seeded successfully.")
    print("\nDemo credentials:")
    print("  admin   / admin123")
    print("  ctrl1   / ctrl123")
    print("  mgr1    / mgr123")
    print("  driver1 / driver123")

if __name__ == "__main__":
    seed()
