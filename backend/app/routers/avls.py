from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import GpsPing, Vehicle, User, Duty, Route
from app.auth import decode_token
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/avls", tags=["avls"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# GET /api/v1/avls/live
# Returns the latest GPS ping for every active vehicle
@router.get("/live")
def live_map(depot_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get latest ping per vehicle using a subquery
    latest = db.query(
        GpsPing.vehicle_id,
        func.max(GpsPing.ts).label("max_ts")
    ).group_by(GpsPing.vehicle_id).subquery()

    pings = db.query(GpsPing).join(
        latest,
        (GpsPing.vehicle_id == latest.c.vehicle_id) &
        (GpsPing.ts == latest.c.max_ts)
    ).all()

    result = []
    for ping in pings:
        vehicle = db.query(Vehicle).filter(Vehicle.id == ping.vehicle_id).first()
        if not vehicle:
            continue

        # Filter by depot if requested
        if depot_id and vehicle.depot_id != depot_id:
            continue

        # Find today's driver for this vehicle
        from datetime import date
        duty = db.query(Duty).filter(
            Duty.vehicle_id == vehicle.id,
            Duty.date == date.today()
        ).first()
        driver_name = ""
        route_name = ""
        if duty:
            driver = db.query(User).filter(User.id == duty.driver_id).first()
            route = db.query(Route).filter(Route.id == duty.route_id).first()
            driver_name = driver.full_name if driver else ""
            route_name = route.name if route else ""

        result.append({
            "vehicle_id": vehicle.id,
            "reg_no": vehicle.reg_no,
            "lat": ping.lat,
            "lng": ping.lng,
            "speed_kmh": ping.speed_kmh,
            "ts": ping.ts,
            "driver_name": driver_name,
            "route_name": route_name,
            "depot_id": vehicle.depot_id
        })
    return result

# GET /api/v1/avls/recent/{vehicle_id}
# Returns last 30 minutes of pings for one vehicle (for the polyline)
@router.get("/recent/{vehicle_id}")
def recent_pings(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    thirty_min_ago = datetime.utcnow() - timedelta(minutes=30)
    pings = db.query(GpsPing).filter(
        GpsPing.vehicle_id == vehicle_id,
        GpsPing.ts >= thirty_min_ago
    ).order_by(GpsPing.ts.asc()).all()

    return [{"lat": p.lat, "lng": p.lng, "ts": p.ts, "speed_kmh": p.speed_kmh} for p in pings]

# GET /api/v1/avls/history?vehicle_id=X&date=YYYY-MM-DD
# Returns all pings for a vehicle on a given date
@router.get("/history")
def history(vehicle_id: int, date: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    day_start = datetime.strptime(date, "%Y-%m-%d")
    day_end   = day_start + timedelta(days=1)

    pings = db.query(GpsPing).filter(
        GpsPing.vehicle_id == vehicle_id,
        GpsPing.ts >= day_start,
        GpsPing.ts < day_end
    ).order_by(GpsPing.ts.asc()).all()

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    return {
        "vehicle_reg": vehicle.reg_no if vehicle else "",
        "pings": [{"lat": p.lat, "lng": p.lng, "ts": str(p.ts)} for p in pings]
    }

# GET /api/v1/avls/vehicles — list all vehicles for the history dropdown
@router.get("/vehicles")
def all_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicles = db.query(Vehicle).all()
    return [{"id": v.id, "reg_no": v.reg_no, "depot_id": v.depot_id} for v in vehicles]
