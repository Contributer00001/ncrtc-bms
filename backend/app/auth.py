import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

# Check if the password the user typed matches the hashed one in the DB
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

# Create a JWT token that expires in 24 hours
def create_token(user_id, username, role, depot_id):
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "depot_id": depot_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Read a JWT token and return what's inside it
def decode_token(token):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
