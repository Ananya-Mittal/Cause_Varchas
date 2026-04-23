"""
services/weather.py — Rainfall + temperature from Open-Meteo (free, no key needed).
"""

import logging
from typing import Tuple
import requests
from config import OPENMETEO_URL

logger = logging.getLogger(__name__)

_TIMEOUT = 12  # seconds


def get_weather(lat: float, lon: float) -> Tuple[float, float]:
    """
    Returns (rainfall_mm_24h, temp_celsius).
    Falls back to (3.0, 28.0) on any error.
    """
    params = {
        "latitude":  lat,
        "longitude": lon,
        "hourly":    "rain,temperature_2m",
        "forecast_days": 1,
    }
    try:
        r = requests.get(OPENMETEO_URL, params=params, timeout=_TIMEOUT)
        r.raise_for_status()
        data = r.json()
        hourly = data.get("hourly", {})

        rain_list = hourly.get("rain", [])
        temp_list = hourly.get("temperature_2m", [])

        rainfall = round(sum(precip_list[:24]), 2) if precip_list else 3.0

        # prevent zero collapse
        if rainfall <= 0:
            rainfall = 0.8
        temp     = round(sum(temp_list[:24]) / len(temp_list[:24]), 1) if temp_list else 28.0

        return rainfall, temp

    except requests.exceptions.Timeout:
        logger.warning("Open-Meteo timeout for (%s, %s)", lat, lon)
    except Exception as exc:
        logger.warning("Open-Meteo error for (%s, %s): %s", lat, lon, exc)

    return 3.0, 28.0


# Keep backward-compat alias used by old code
def get_rainfall(lat: float, lon: float) -> float:
    rainfall, _ = get_weather(lat, lon)
    return rainfall


def rainfall_status(rainfall: float) -> str:
    if rainfall > 12:
        return "Flood Risk"
    elif rainfall > 3:
        return "Normal"
    else:
        return "Drought Risk"
