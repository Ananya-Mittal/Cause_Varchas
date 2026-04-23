"""
schemas/ — Request and response Pydantic models.
"""

from pydantic import BaseModel, validator, Field
from typing import List, Dict, Optional


class CreditRequest(BaseModel):
    lat:      float = Field(..., ge=-90, le=90,   description="Latitude  (WGS-84)")
    lon:      float = Field(..., ge=-180, le=180,  description="Longitude (WGS-84)")
    crop:     str   = Field(..., min_length=2,     description="Crop type (e.g. wheat, rice)")
    area_ha:  float = Field(default=1.0, gt=0, le=10000, description="Farm area in hectares")
    crop_age: float = Field(default=0.5, ge=0, le=1,     description="Fraction of season elapsed")

    @validator("crop")
    def normalise_crop(cls, v):
        return v.strip().lower()


class ScoreFactor(BaseModel):
    factor: str
    status: str
    impact: str   # "positive" | "neutral" | "negative"
    detail: str


class CreditResponse(BaseModel):
    score:          int
    decision:       str
    risk_tier:      str
    loan_limit:     int
    revenue:        int
    estimated_yield: str
    ndvi:           float
    rainfall_mm:    float
    temp_c:         float
    crop_health:    str
    weather_status: str
    soil_status:    str
    factors:        List[ScoreFactor]
    evaluation_id:  Optional[int] = None
