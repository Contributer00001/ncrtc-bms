from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.auth import verify_password, create_token, decode_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# This tells FastAPI where to find the token in requests
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# POST /api/v1/auth/login
# Takes username + password, returns a JWT token
@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find the user in the database
    user = db.query(User).filter(User.username == form.username).first()

    # If user not found or wrong password, return error
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Wrong username or password")

    # Create and return the token
    token = create_token(user.id, user.username, user.role, user.depot_id)
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# GET /api/v1/auth/me
# Returns the currently logged-in user's info
@router.get("/me")
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "depot_id": user.depot_id
    }
