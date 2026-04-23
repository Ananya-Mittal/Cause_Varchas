"""
app.py — Agri Credit AI  — FastAPI application entry point.

Run:
    python -m uvicorn app:app --reload
    python -m uvicorn app:app --host 0.0.0.0 --port 5000 --reload
"""

import random
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from schemas.schemas import CreditRequest, CreditResponse
from services.satellite import get_ndvi
from services.weather import get_weather, rainfall_status
from services.yield_calc import estimate_yield, estimate_revenue
from services.loan import loan_decision
from services.explain import explain_score
from ml.predict_model import predict_score
from database.db import get_db, engine
from database import models
from auth.router import router as auth_router, get_current_farmer

# ── Initialise DB ──────────────────────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Agri Credit AI — Varchas",
    version="2.0.0",
    description="ML-powered agricultural credit scoring for smallholder farmers.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


# ── Helper functions ──────────────────────────────────────────────────────────

def _crop_health(ndvi: float) -> str:
    if ndvi >= 0.65:
        return "Good"
    elif ndvi >= 0.4:
        return "Moderate"
    return "Poor"


def _soil_status(soil: float) -> str:
    if soil >= 0.6:
        return "Healthy Soil"
    elif soil >= 0.35:
        return "Dry Soil"
    return "Soil Data Unavailable"


# ── Credit-score endpoint ─────────────────────────────────────────────────────

@app.post("/credit-score", response_model=CreditResponse)
def credit_score(
    data: CreditRequest,
    db: Session = Depends(get_db),
    # Uncomment to require auth:
    # farmer=Depends(get_current_farmer),
):
    """
    Full credit-score pipeline:
    1. Fetch NDVI from Google Earth Engine (or heuristic fallback)
    2. Fetch rainfall + temperature from Open-Meteo
    3. Estimate soil moisture (sensor API placeholder → random for now)
    4. Estimate crop yield
    5. Estimate revenue
    6. Run ML ensemble model for credit score
    7. Compute loan limit + underwriting decision
    8. Generate human-readable factor explanations
    9. Persist evaluation to DB
    """

    lat   = data.lat
    lon   = data.lon
    crop  = data.crop
    area  = data.area_ha
    c_age = data.crop_age

    # 1. Satellite NDVI
    ndvi = get_ndvi(lat, lon)

    # 2. Weather
    rainfall, temp = get_weather(lat, lon)
    rain_status    = rainfall_status(rainfall)

    # 3. Soil moisture (placeholder — replace with IoT / SoilGrids API)
    soil = round(random.uniform(0.3, 0.9), 3)

    # 4. Yield
    est_yield = estimate_yield(crop, ndvi, rainfall)

    # 5. Revenue
    revenue = estimate_revenue(crop, est_yield, area)

    # 6. ML credit score (now passes temp + crop_age)
    score = predict_score(
        ndvi=ndvi,
        rainfall=rainfall,
        soil=soil,
        yield_est=est_yield,
        temp=temp,
        crop_age=c_age,
    )

    # 7. Loan decision
    loan_limit, decision, risk_tier = loan_decision(revenue, score, area)

    # 8. Explanations
    factors = explain_score(ndvi, rain_status, est_yield, soil, temp, score)

    # 9. Persist
    record = models.Evaluation(
        lat=lat, lon=lon, crop=crop,
        ndvi=ndvi, rainfall=rainfall, soil=soil, temp=temp, crop_age=c_age,
        yield_est=est_yield, revenue=revenue, loan_limit=loan_limit,
        score=score, decision=decision,
        crop_health=_crop_health(ndvi),
        weather_status=rain_status,
        soil_status=_soil_status(soil),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return CreditResponse(
        score          = int(score),
        decision       = decision,
        risk_tier      = risk_tier,
        loan_limit     = int(loan_limit),
        revenue        = int(revenue),
        estimated_yield= f"{est_yield} t/ha",
        ndvi           = round(ndvi, 3),
        rainfall_mm    = rainfall,
        temp_c         = temp,
        crop_health    = _crop_health(ndvi),
        weather_status = rain_status,
        soil_status    = _soil_status(soil),
        factors        = factors,
        evaluation_id  = record.id,
    )


# ── History endpoint ──────────────────────────────────────────────────────────

@app.get("/history")
def history(limit: int = 10, db: Session = Depends(get_db)):
    rows = (
        db.query(models.Evaluation)
        .order_by(models.Evaluation.id.desc())
        .limit(min(limit, 100))
        .all()
    )
    return [
        {
            "id":       r.id,
            "crop":     r.crop,
            "score":    int(r.score) if r.score else None,
            "decision": r.decision,
            "lat":      r.lat,
            "lon":      r.lon,
            "created_at": str(r.created_at),
        }
        for r in rows
    ]


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
