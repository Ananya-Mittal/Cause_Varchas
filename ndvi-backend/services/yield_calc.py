"""
services/yield_calc.py — Agronomic yield estimation + revenue calculation.
"""

from config import CROP_PRICES

# ── Crop-specific parameters ──────────────────────────────────────────────────
# base_yield: tons/ha at average conditions
# ndvi_coeff: how strongly NDVI lifts yield
# rainfall_opt: mm/day at which rainfall is ideal (bell-curve benefit)
_CROP_PARAMS: dict[str, dict] = {
    "wheat":    {"base": 3.0, "ndvi_coeff": 2.0, "rain_opt": 4.0},
    "rice":     {"base": 3.5, "ndvi_coeff": 2.5, "rain_opt": 8.0},
    "maize":    {"base": 4.0, "ndvi_coeff": 2.2, "rain_opt": 6.0},
    "cotton":   {"base": 1.5, "ndvi_coeff": 1.5, "rain_opt": 5.0},
    "sugarcane":{"base": 60.0,"ndvi_coeff":30.0, "rain_opt": 7.0},
    "soybean":  {"base": 2.0, "ndvi_coeff": 2.0, "rain_opt": 5.0},
    "groundnut":{"base": 1.8, "ndvi_coeff": 1.8, "rain_opt": 4.5},
    "mustard":  {"base": 1.5, "ndvi_coeff": 1.5, "rain_opt": 3.0},
    "barley":   {"base": 2.5, "ndvi_coeff": 1.8, "rain_opt": 3.5},
    "sorghum":  {"base": 2.2, "ndvi_coeff": 1.6, "rain_opt": 3.5},
}

_DEFAULT_PARAMS = {"base": 2.5, "ndvi_coeff": 2.0, "rain_opt": 5.0}


def estimate_yield(crop: str, ndvi: float, rainfall: float = 5.0) -> float:
    """
    Estimate yield (tons/ha) using NDVI + rainfall proximity to optimum.
    """
    p = _CROP_PARAMS.get(crop.lower(), _DEFAULT_PARAMS)

    # Rainfall factor: Gaussian bell centred on optimal rainfall
    import math
    rain_factor = math.exp(-0.5 * ((rainfall - p["rain_opt"]) / 4.0) ** 2)

    est = p["base"] + (ndvi * p["ndvi_coeff"]) * rain_factor
    return round(max(0.1, est), 2)


def estimate_revenue(crop: str, est_yield: float, area_ha: float = 1.0) -> float:
    """
    Revenue (₹) = yield × price_per_ton × area.
    """
    price   = CROP_PRICES.get(crop.lower(), 20000)
    revenue = est_yield * price * area_ha
    return round(revenue, 2)
