from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Notice, NoticeRead, User
from app.auth import decode_token
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/v1/notices", tags=["cms"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Helper — get current user from token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# Shape of data when creating a notice
class NoticeCreate(BaseModel):
    title: str
    body: str
    audience: str = "all"
    depot_id: Optional[int] = None

# GET /api/v1/notices
# Admin sees all notices. Driver sees only notices meant for them.
@router.get("/")
def list_notices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role in ["admin", "control_operator"]:
        notices = db.query(Notice).order_by(Notice.publish_at.desc()).all()
    else:
        # Driver sees notices for "all" or their specific depot
        notices = db.query(Notice).filter(
            (Notice.audience == "all") |
            (Notice.depot_id == current_user.depot_id)
        ).order_by(Notice.publish_at.desc()).all()

    result = []
    for n in notices:
        # Check if this user has read this notice
        read = db.query(NoticeRead).filter(
            NoticeRead.notice_id == n.id,
            NoticeRead.user_id == current_user.id
        ).first()
        result.append({
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "audience": n.audience,
            "publish_at": n.publish_at,
            "is_read": read is not None
        })
    return result

# POST /api/v1/notices
# Only admin can create notices
@router.post("/")
def create_notice(data: NoticeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create notices")

    notice = Notice(
        title=data.title,
        body=data.body,
        audience=data.audience,
        depot_id=data.depot_id,
        created_by=current_user.id,
        publish_at=datetime.utcnow()
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return {"id": notice.id, "title": notice.title, "message": "Notice created"}

# POST /api/v1/notices/{id}/read
# Driver marks a notice as read
@router.post("/{notice_id}/read")
def mark_read(notice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Don't insert duplicate read receipts
    existing = db.query(NoticeRead).filter(
        NoticeRead.notice_id == notice_id,
        NoticeRead.user_id == current_user.id
    ).first()
    if not existing:
        db.add(NoticeRead(notice_id=notice_id, user_id=current_user.id, read_at=datetime.utcnow()))
        db.commit()
    return {"message": "Marked as read"}

# GET /api/v1/notices/{id}/receipts
# Admin sees who has and hasn't read a notice
@router.get("/{notice_id}/receipts")
def get_receipts(notice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view receipts")

    # Everyone who has read it
    reads = db.query(NoticeRead).filter(NoticeRead.notice_id == notice_id).all()
    read_user_ids = [r.user_id for r in reads]

    # All drivers
    all_drivers = db.query(User).filter(User.role == "driver").all()

    return {
        "read": [{"id": r.user_id, "read_at": r.read_at} for r in reads],
        "unread": [{"id": u.id, "username": u.username, "full_name": u.full_name}
                   for u in all_drivers if u.id not in read_user_ids]
    }
