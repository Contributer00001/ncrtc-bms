from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import models
from app.routers import auth, cms

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NCRTC BMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cms.router)

@app.get("/")
def root():
    return {"message": "NCRTC BMS is running"}

@app.get("/health")
def health():
    return {"status": "ok"}
