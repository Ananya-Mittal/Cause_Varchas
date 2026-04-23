"""
services/explain.py — Human-readable score factor explanations.
"""

from typing import List, Dict


def explain_score(
    ndvi: float,
    weather: str,
    yield_est: float,
    soil: float,
    temp: float,
    score: float,
) -> List[Dict[str, str]]:
    """
    Returns a list of factor dicts with keys: factor, status, impact.
    """
    factors: List[Dict[str, str]] = []

    # ── Vegetation health ──────────────────────────────────────────────────
    if ndvi >= 0.7:
        factors.append({"factor": "Crop Vegetation", "status": "Excellent",
                         "impact": "positive", "detail": f"NDVI {ndvi:.2f} — very healthy canopy"})
    elif ndvi >= 0.5:
        factors.append({"factor": "Crop Vegetation", "status": "Good",
                         "impact": "positive", "detail": f"NDVI {ndvi:.2f} — healthy crop growth"})
    elif ndvi >= 0.3:
        factors.append({"factor": "Crop Vegetation", "status": "Moderate",
                         "impact": "neutral", "detail": f"NDVI {ndvi:.2f} — average crop condition"})
    else:
        factors.append({"factor": "Crop Vegetation", "status": "Poor",
                         "impact": "negative", "detail": f"NDVI {ndvi:.2f} — stressed or sparse crop"})

    # ── Rainfall ──────────────────────────────────────────────────────────
    weather_map = {
        "Normal":       ("Rainfall",  "Adequate",    "positive", "Rainfall is within optimal range"),
        "Drought Risk": ("Rainfall",  "Insufficient","negative", "Low rainfall — drought stress likely"),
        "Flood Risk":   ("Rainfall",  "Excessive",   "negative", "Heavy rainfall — flood damage risk"),
    }
    if weather in weather_map:
        f, s, i, d = weather_map[weather]
        factors.append({"factor": f, "status": s, "impact": i, "detail": d})

    # ── Yield ────────────────────────────────────────────────────────────
    if yield_est >= 4:
        factors.append({"factor": "Expected Yield", "status": "High",
                         "impact": "positive", "detail": f"{yield_est} t/ha — strong harvest expected"})
    elif yield_est >= 2.5:
        factors.append({"factor": "Expected Yield", "status": "Average",
                         "impact": "neutral", "detail": f"{yield_est} t/ha — typical harvest"})
    else:
        factors.append({"factor": "Expected Yield", "status": "Low",
                         "impact": "negative", "detail": f"{yield_est} t/ha — below-average harvest"})

    # ── Soil moisture ────────────────────────────────────────────────────
    if soil >= 0.6:
        factors.append({"factor": "Soil Moisture", "status": "Healthy",
                         "impact": "positive", "detail": "Good soil moisture for root uptake"})
    elif soil >= 0.35:
        factors.append({"factor": "Soil Moisture", "status": "Moderate",
                         "impact": "neutral", "detail": "Soil moisture is marginally sufficient"})
    else:
        factors.append({"factor": "Soil Moisture", "status": "Dry",
                         "impact": "negative", "detail": "Soil is too dry — irrigation needed"})

    # ── Temperature ───────────────────────────────────────────────────────
    if temp > 38:
        factors.append({"factor": "Temperature", "status": "Heat Stress",
                         "impact": "negative", "detail": f"{temp}°C — extreme heat reduces yield"})
    elif temp < 10:
        factors.append({"factor": "Temperature", "status": "Cold Stress",
                         "impact": "negative", "detail": f"{temp}°C — cold may damage crops"})
    else:
        factors.append({"factor": "Temperature", "status": "Optimal",
                         "impact": "positive", "detail": f"{temp}°C — suitable growing temperature"})

    return factors
