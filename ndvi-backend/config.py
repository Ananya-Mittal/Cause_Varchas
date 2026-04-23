"""
config.py — Central configuration with environment variable fallbacks.
Never hard-code secrets in production; use a .env file + python-dotenv.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Security ──────────────────────────────────────────────────────────────────
SECRET_KEY   = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_supersecretkey123!")
ALGORITHM    = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "4"))

# ── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agri_credit.db")

# ── External APIs ─────────────────────────────────────────────────────────────
OPENMETEO_URL     = "https://api.open-meteo.com/v1/forecast"
GEE_PROJECT_ID    = os.getenv("GEE_PROJECT_ID", "agricultural-land-486413")

# ── ML ────────────────────────────────────────────────────────────────────────
MODEL_PATH    = os.getenv("MODEL_PATH", "ml/model.pkl")
FEATURES_PATH = os.getenv("FEATURES_PATH", "ml/features.pkl")

# ── Crop prices (₹ per ton) ───────────────────────────────────────────────────
CROP_PRICES: dict[str, float] = {
    "wheat":       22000,
    "rice":        20000,
    "maize":       18000,
    "cotton":      65000,
    "sugarcane":    3500,
    "soybean":     45000,
    "groundnut":   55000,
    "mustard":     52000,
    "barley":      16000,
    "sorghum":     15000,
}
