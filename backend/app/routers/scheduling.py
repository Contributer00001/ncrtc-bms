from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Route, RouteStop, Stop, Duty, User, Vehicle, Depot
from app.auth import decode_token
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter(prefix="/api/v1/scheduling", tags=["scheduling"])
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

# --- ROUTES ---

class RouteCreate(BaseModel):
    code: str
    name: str
    depot_id: int

# GET /api/v1/scheduling/routes
@router.get("/routes")
def list_routes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role in ["admin", "control_operator"]:
        routes = db.query(Route).all()
    else:
        routes = db.query(Route).filter(Route.depot_id == current_user.depot_id).all()
    return [{"id": r.id, "code": r.code, "name": r.name, "depot_id": r.depot_id} for r in routes]

# POST /api/v1/scheduling/routes
@router.post("/routes")
def create_route(data: RouteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create routes")
    route = Route(code=data.code, name=data.name, depot_id=data.depot_id)
    db.add(route)
    db.commit()
    db.refresh(route)
    return {"id": route.id, "message": "Route created"}

# DELETE /api/v1/scheduling/routes/{id}
@router.delete("/routes/{route_id}")
def delete_route(route_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete routes")
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    db.delete(route)
    db.commit()
    return {"message": "Route deleted"}

# --- DUTIES ---

class DutyCreate(BaseModel):
    driver_id: int
    vehicle_id: int
    route_id: int
    date: str
    start_time: str
    end_time: str

# GET /api/v1/scheduling/duties?date=YYYY-MM-DD
@router.get("/duties")
def list_duties(date: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Duty)

    # Depot managers only see their depot's duties
    if current_user.role == "depot_manager":
        # Get all drivers in this depot
        depot_driver_ids = [u.id for u in db.query(User).filter(User.depot_id == current_user.depot_id).all()]
        query = query.filter(Duty.driver_id.in_(depot_driver_ids))

    if date:
        query = query.filter(Duty.date == date)

    duties = query.all()
    result = []
    for d in duties:
        driver = db.query(User).filter(User.id == d.driver_id).first()
        vehicle = db.query(Vehicle).filter(Vehicle.id == d.vehicle_id).first()
        route = db.query(Route).filter(Route.id == d.route_id).first()
        result.append({
            "id": d.id,
            "date": str(d.date),
            "driver_id": d.driver_id,
            "driver_name": driver.full_name if driver else "",
            "vehicle_id": d.vehicle_id,
            "vehicle_reg": vehicle.reg_no if vehicle else "",
        "vehicle_id": vehicle.id if vehicle else None,
            "route_id": d.route_id,
            "route_name": route.name if route else "",
            "start_time": d.start_time,
            "end_time": d.end_time,
            "status": d.status,
            "ack_at": str(d.ack_at) if d.ack_at else None
        })
    return result

# POST /api/v1/scheduling/duties
@router.post("/duties")
def create_duty(data: DutyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "depot_manager"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    # Check: same driver can't have two duties on the same day
    conflict = db.query(Duty).filter(
        Duty.driver_id == data.driver_id,
        Duty.date == data.date
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Driver already has a duty on this date")

    duty = Duty(
        driver_id=data.driver_id,
        vehicle_id=data.vehicle_id,
        route_id=data.route_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        status="draft"
    )
    db.add(duty)
    db.commit()
    db.refresh(duty)
    return {"id": duty.id, "message": "Duty created"}

# PATCH /api/v1/scheduling/duties/{id}/publish
@router.patch("/duties/{duty_id}/publish")
def publish_duty(duty_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "depot_manager"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    duty = db.query(Duty).filter(Duty.id == duty_id).first()
    if not duty:
        raise HTTPException(status_code=404, detail="Duty not found")
    duty.status = "published"
    db.commit()
    return {"message": "Duty published"}

# PATCH /api/v1/scheduling/duties/{id}/acknowledge
@router.patch("/duties/{duty_id}/acknowledge")
def acknowledge_duty(duty_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime
    duty = db.query(Duty).filter(Duty.id == duty_id, Duty.driver_id == current_user.id).first()
    if not duty:
        raise HTTPException(status_code=404, detail="Duty not found")
    duty.ack_at = datetime.utcnow()
    db.commit()
    return {"message": "Duty acknowledged"}

# GET /api/v1/scheduling/duties/mine
# Driver sees their own duty for today
@router.get("/duties/mine")
def my_duty(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = str(date.today())
    duty = db.query(Duty).filter(
        Duty.driver_id == current_user.id,
        Duty.date == today,
        Duty.status == "published"
    ).first()
    if not duty:
        return None
    vehicle = db.query(Vehicle).filter(Vehicle.id == duty.vehicle_id).first()
    route = db.query(Route).filter(Route.id == duty.route_id).first()
    return {
        "id": duty.id,
        "date": str(duty.date),
        "vehicle_reg": vehicle.reg_no if vehicle else "",
        "vehicle_id": vehicle.id if vehicle else None,
        "route_name": route.name if route else "",
        "start_time": duty.start_time,
        "end_time": duty.end_time,
        "status": duty.status,
        "ack_at": str(duty.ack_at) if duty.ack_at else None
    }

# GET /api/v1/scheduling/drivers — list drivers in manager's depot
@router.get("/drivers")
def list_drivers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "depot_manager":
        drivers = db.query(User).filter(User.depot_id == current_user.depot_id, User.role == "driver").all()
    else:
        drivers = db.query(User).filter(User.role == "driver").all()
    return [{"id": u.id, "full_name": u.full_name, "username": u.username} for u in drivers]

# GET /api/v1/scheduling/vehicles — list vehicles in manager's depot
@router.get("/vehicles")
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "depot_manager":
        vehicles = db.query(Vehicle).filter(Vehicle.depot_id == current_user.depot_id).all()
    else:
        vehicles = db.query(Vehicle).all()
    return [{"id": v.id, "reg_no": v.reg_no} for v in vehicles]

# GET /api/v1/scheduling/depots — list all depots (for admin route creation)
@router.get("/depots")
def list_depots(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    depots = db.query(Depot).all()
    return [{"id": d.id, "name": d.name} for d in depots]
