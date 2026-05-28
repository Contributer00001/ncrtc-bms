from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Depot(Base):
    __tablename__ = "depots"
    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    location_lat = Column(Float)
    location_lng = Column(Float)

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True)
    reg_no = Column(String(20), unique=True, nullable=False)
    depot_id = Column(Integer, ForeignKey("depots.id"))
    status = Column(String(20), default="active")
    depot = relationship("Depot")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    full_name = Column(String(100))
    role = Column(String(30), nullable=False)
    depot_id = Column(Integer, ForeignKey("depots.id"), nullable=True)
    phone = Column(String(20))
    depot = relationship("Depot")

class Stop(Base):
    __tablename__ = "stops"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    lat = Column(Float)
    lng = Column(Float)

class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    depot_id = Column(Integer, ForeignKey("depots.id"))
    depot = relationship("Depot")

class RouteStop(Base):
    __tablename__ = "route_stops"
    id = Column(Integer, primary_key=True)
    route_id = Column(Integer, ForeignKey("routes.id"))
    stop_id = Column(Integer, ForeignKey("stops.id"))
    sequence = Column(Integer)
    planned_offset_min = Column(Integer, default=0)
    route = relationship("Route")
    stop = relationship("Stop")

class Duty(Base):
    __tablename__ = "duties"
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    driver_id = Column(Integer, ForeignKey("users.id"))
    route_id = Column(Integer, ForeignKey("routes.id"))
    start_time = Column(String(10))
    end_time = Column(String(10))
    status = Column(String(20), default="draft")
    ack_at = Column(DateTime, nullable=True)
    vehicle = relationship("Vehicle")
    driver = relationship("User", foreign_keys=[driver_id])
    route = relationship("Route")

class GpsPing(Base):
    __tablename__ = "gps_pings"
    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    ts = Column(DateTime, default=datetime.utcnow)
    lat = Column(Float)
    lng = Column(Float)
    speed_kmh = Column(Float, default=0)
    ignition_on = Column(Boolean, default=True)
    vehicle = relationship("Vehicle")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True)
    type = Column(String(30), nullable=False)
    severity = Column(String(5), nullable=False)
    status = Column(String(20), default="open")
    raised_by = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    depot_id = Column(Integer, ForeignKey("depots.id"))
    description = Column(Text)
    photo_path = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    raiser = relationship("User", foreign_keys=[raised_by])
    assignee = relationship("User", foreign_keys=[assigned_to])

class IncidentEvent(Base):
    __tablename__ = "incident_events"
    id = Column(Integer, primary_key=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    ts = Column(DateTime, default=datetime.utcnow)
    actor_id = Column(Integer, ForeignKey("users.id"))
    from_status = Column(String(20))
    to_status = Column(String(20))
    note = Column(Text)
    incident = relationship("Incident")
    actor = relationship("User")

class Notice(Base):
    __tablename__ = "notices"
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    audience = Column(String(50), default="all")
    depot_id = Column(Integer, ForeignKey("depots.id"), nullable=True)
    publish_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User")

class NoticeRead(Base):
    __tablename__ = "notice_reads"
    id = Column(Integer, primary_key=True)
    notice_id = Column(Integer, ForeignKey("notices.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    read_at = Column(DateTime, default=datetime.utcnow)
