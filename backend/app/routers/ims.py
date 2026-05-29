from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Incident, IncidentEvent, User, Vehicle
from app.auth import decode_token
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os, shutil

router = APIRouter(prefix="/api/v1/ims", tags=["ims"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

VALID_TRANSITIONS = {
    "open":          "acknowledged",
    "acknowledged":  "in_progress",
    "in_progress":   "resolved",
    "resolved":      "closed",
}

class IncidentCreate(BaseModel):
    type:        str
    severity:    str
    description: str
    vehicle_id:  Optional[int] = None

class StatusChange(BaseModel):
    note: str

class AssignChange(BaseModel):
    assigned_to: int

# POST /api/v1/ims/incidents
@router.post("/incidents")
def create_incident(data: IncidentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = Incident(
        type=data.type,
        severity=data.severity,
        description=data.description,
        vehicle_id=data.vehicle_id,
        depot_id=current_user.depot_id,
        raised_by=current_user.id,
        status="open",
        created_at=datetime.utcnow()
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    db.add(IncidentEvent(
        incident_id=incident.id,
        ts=datetime.utcnow(),
        actor_id=current_user.id,
        from_status=None,
        to_status="open",
        note="Incident raised"
    ))
    db.commit()
    return {"id": incident.id, "message": "Incident created"}

# GET /api/v1/ims/incidents
@router.get("/incidents")
def list_incidents(
    status:   Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident)

    if current_user.role == "depot_manager":
        query = query.filter(Incident.depot_id == current_user.depot_id)

    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)

    incidents = query.order_by(Incident.created_at.desc()).all()

    result = []
    for i in incidents:
        raiser  = db.query(User).filter(User.id == i.raised_by).first()
        vehicle = db.query(Vehicle).filter(Vehicle.id == i.vehicle_id).first() if i.vehicle_id else None
        assignee = db.query(User).filter(User.id == i.assigned_to).first() if i.assigned_to else None
        result.append({
            "id":           i.id,
            "type":         i.type,
            "severity":     i.severity,
            "status":       i.status,
            "description":  i.description,
            "raised_by":    raiser.full_name if raiser else "",
            "assigned_to":  assignee.full_name if assignee else "",
            "vehicle_reg":  vehicle.reg_no if vehicle else "",
            "created_at":   str(i.created_at),
            "resolved_at":  str(i.resolved_at) if i.resolved_at else None,
        })
    return result

# GET /api/v1/ims/incidents/{id}
@router.get("/incidents/{incident_id}")
def get_incident(incident_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Not found")

    events = db.query(IncidentEvent).filter(
        IncidentEvent.incident_id == incident_id
    ).order_by(IncidentEvent.ts.asc()).all()

    event_list = []
    for e in events:
        actor = db.query(User).filter(User.id == e.actor_id).first()
        event_list.append({
            "ts":          str(e.ts),
            "actor":       actor.full_name if actor else "",
            "from_status": e.from_status,
            "to_status":   e.to_status,
            "note":        e.note
        })

    raiser   = db.query(User).filter(User.id == incident.raised_by).first()
    vehicle  = db.query(Vehicle).filter(Vehicle.id == incident.vehicle_id).first() if incident.vehicle_id else None
    assignee = db.query(User).filter(User.id == incident.assigned_to).first() if incident.assigned_to else None

    return {
        "id":          incident.id,
        "type":        incident.type,
        "severity":    incident.severity,
        "status":      incident.status,
        "description": incident.description,
        "raised_by":   raiser.full_name if raiser else "",
        "assigned_to": assignee.full_name if assignee else "",
        "vehicle_reg": vehicle.reg_no if vehicle else "",
        "created_at":  str(incident.created_at),
        "resolved_at": str(incident.resolved_at) if incident.resolved_at else None,
        "events":      event_list
    }

# PATCH /api/v1/ims/incidents/{id}/status
@router.patch("/incidents/{incident_id}/status")
def change_status(incident_id: int, data: StatusChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Not found")

    next_status = VALID_TRANSITIONS.get(incident.status)
    if not next_status:
        raise HTTPException(status_code=400, detail="Incident is already closed")

    db.add(IncidentEvent(
        incident_id=incident.id,
        ts=datetime.utcnow(),
        actor_id=current_user.id,
        from_status=incident.status,
        to_status=next_status,
        note=data.note
    ))

    incident.status = next_status
    if next_status == "resolved":
        incident.resolved_at = datetime.utcnow()

    db.commit()
    return {"message": f"Status changed to {next_status}"}

# PATCH /api/v1/ims/incidents/{id}/assign
@router.patch("/incidents/{incident_id}/assign")
def assign_incident(incident_id: int, data: AssignChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "depot_manager", "control_operator"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Not found")
    incident.assigned_to = data.assigned_to
    db.commit()
    return {"message": "Assigned"}

# GET /api/v1/ims/users — for assign dropdown
@router.get("/users")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).filter(User.role.in_(["depot_manager", "control_operator", "admin"])).all()
    return [{"id": u.id, "full_name": u.full_name} for u in users]
