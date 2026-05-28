from fastapi import FastAPI

app = FastAPI(title="NCRTC BMS API")

@app.get("/")
def root():
    return {"message": "NCRTC BMS is running"}

@app.get("/health")
def health():
    return {"status": "ok"}