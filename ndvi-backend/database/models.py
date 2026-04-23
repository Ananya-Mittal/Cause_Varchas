"""
database/models.py — SQLAlchemy ORM models.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database.db import Base


class Farmer(Base):
    __tablename__ = "farmers"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(120), nullable=False)
    phone           = Column(String(15), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


class Evaluation(Base):
    __tablename__ = "evaluations"

    id         = Column(Integer, primary_key=True, index=True)
    farmer_id  = Column(Integer, ForeignKey("farmers.id"), nullable=True)

    # Location
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    crop = Column(String(50))

    # Satellite / weather features
    ndvi         = Column(Float)
    rainfall     = Column(Float)
    soil         = Column(Float)
    temp         = Column(Float)
    crop_age     = Column(Float)

    # Derived
    yield_est    = Column(Float)
    revenue      = Column(Float)
    loan_limit   = Column(Float)
    score        = Column(Float)
    decision     = Column(String(20))
    crop_health  = Column(String(20))
    weather_status = Column(String(30))
    soil_status  = Column(String(30))

    created_at   = Column(DateTime(timezone=True), server_default=func.now())
