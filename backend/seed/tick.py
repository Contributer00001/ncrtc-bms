import sys, os, time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.models import GpsPing, Vehicle
from datetime import datetime

# 6 different routes so every vehicle is in a different spot
ROUTE_COORDS = [
    [ # Anand Vihar → Vaishali
        (28.6469, 77.3160), (28.6458, 77.3168), (28.6447, 77.3172),
        (28.6440, 77.3175), (28.6435, 77.3177), (28.6425, 77.3178),
        (28.6415, 77.3179), (28.6412, 77.3178), (28.6420, 77.3200),
        (28.6428, 77.3220), (28.6435, 77.3245), (28.6440, 77.3270),
        (28.6443, 77.3295), (28.6445, 77.3320), (28.6445, 77.3345),
    ],
    [ # Vaishali → Anand Vihar (reverse)
        (28.6445, 77.3345), (28.6445, 77.3320), (28.6443, 77.3295),
        (28.6440, 77.3270), (28.6435, 77.3245), (28.6428, 77.3220),
        (28.6420, 77.3200), (28.6412, 77.3178), (28.6415, 77.3179),
        (28.6425, 77.3178), (28.6435, 77.3177), (28.6440, 77.3175),
        (28.6447, 77.3172), (28.6458, 77.3168), (28.6469, 77.3160),
    ],
    [ # Noida Sec 37 → Botanical Garden
        (28.5672, 77.3210), (28.5680, 77.3225), (28.5690, 77.3240),
        (28.5700, 77.3255), (28.5705, 77.3260), (28.5700, 77.3270),
        (28.5695, 77.3280), (28.5685, 77.3300), (28.5675, 77.3320),
        (28.5665, 77.3340), (28.5655, 77.3360), (28.5640, 77.3375),
        (28.5630, 77.3378), (28.5625, 77.3380), (28.5620, 77.3380),
    ],
    [ # Botanical Garden → Noida Sec 37 (reverse)
        (28.5620, 77.3380), (28.5625, 77.3378), (28.5630, 77.3375),
        (28.5640, 77.3360), (28.5655, 77.3340), (28.5665, 77.3320),
        (28.5675, 77.3300), (28.5685, 77.3280), (28.5695, 77.3270),
        (28.5700, 77.3260), (28.5705, 77.3255), (28.5700, 77.3240),
        (28.5690, 77.3225), (28.5680, 77.3210), (28.5672, 77.3210),
    ],
    [ # Ghaziabad Stn → Raj Nagar
        (28.6692, 77.4538), (28.6698, 77.4510), (28.6705, 77.4480),
        (28.6710, 77.4455), (28.6715, 77.4435), (28.6718, 77.4425),
        (28.6720, 77.4420), (28.6725, 77.4418), (28.6728, 77.4417),
        (28.6730, 77.4420), (28.6728, 77.4422), (28.6725, 77.4420),
    ],
    [ # Raj Nagar → Ghaziabad Stn (reverse)
        (28.6730, 77.4420), (28.6728, 77.4422), (28.6725, 77.4420),
        (28.6720, 77.4420), (28.6718, 77.4425), (28.6715, 77.4435),
        (28.6710, 77.4455), (28.6705, 77.4480), (28.6698, 77.4510),
        (28.6692, 77.4538), (28.6695, 77.4530), (28.6692, 77.4538),
    ],
]

position_index = {}

def tick():
    db = SessionLocal()
    try:
        vehicles = db.query(Vehicle).filter(Vehicle.status == "active").all()
        if not vehicles:
            print("No vehicles found — waiting for seed...")
            return

        for i, vehicle in enumerate(vehicles):
            # Each vehicle gets its own unique route
            coords = ROUTE_COORDS[i % len(ROUTE_COORDS)]
            idx = position_index.get(vehicle.id, i * 3 % len(coords))
            lat, lng = coords[idx]

            db.add(GpsPing(
                vehicle_id=vehicle.id,
                ts=datetime.utcnow(),
                lat=lat,
                lng=lng,
                speed_kmh=25 + (idx % 4) * 5,
                ignition_on=True
            ))
            position_index[vehicle.id] = (idx + 1) % len(coords)

        db.commit()
        print(f"Tick at {datetime.utcnow().strftime('%H:%M:%S')} — {len(vehicles)} vehicles updated")

    except Exception as e:
        print(f"Tick error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("GPS tick script started. Press Ctrl+C to stop.")
    while True:
        tick()
        time.sleep(5)
