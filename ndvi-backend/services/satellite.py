"""
services/satellite.py — NDVI retrieval via Google Earth Engine.
Uses a simple in-memory LRU cache to avoid redundant GEE calls.
"""

import functools
import logging
import math
from config import GEE_PROJECT_ID

logger = logging.getLogger(__name__)

_gee_ready = False


def _init_gee():
    global _gee_ready
    if _gee_ready:
        return True
    try:
        import ee
        try:
            ee.Initialize(project=GEE_PROJECT_ID)
        except Exception:
            ee.Authenticate()
            ee.Initialize(project=GEE_PROJECT_ID)
        _gee_ready = True
        return True
    except Exception as exc:
        logger.warning("GEE initialisation failed: %s", exc)
        return False


@functools.lru_cache(maxsize=512)
def get_ndvi(lat: float, lon: float) -> float:
    """
    Returns the median NDVI (2024) for the point (lat, lon).
    Falls back to a biome-based heuristic if GEE is unavailable.
    Results are cached by (lat, lon) pair.
    """
    # Round coords to ~1 km grid to maximise cache hits
    lat_r = round(lat, 2)
    lon_r = round(lon, 2)

    if _init_gee():
        try:
            import ee
            point = ee.Geometry.Point([lon_r, lat_r])
            image = (
                ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(point)
                .filterDate("2024-01-01", "2024-12-31")
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
                .median()
            )
            ndvi_band = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
            result = ndvi_band.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=point,
                scale=10,
                maxPixels=1e6,
            ).getInfo()

            if result and "NDVI" in result and result["NDVI"] is not None:
                return round(float(result["NDVI"]), 3)
        except Exception as exc:
            logger.warning("GEE NDVI error for (%s, %s): %s", lat, lon, exc)

    # ── Fallback: latitude-based heuristic ──────────────────────────────────
    return _ndvi_heuristic(lat_r, lon_r)


def _ndvi_heuristic(lat: float, lon: float) -> float:
    """
    Very rough NDVI estimate when GEE is unavailable.
    Based solely on absolute latitude (tropical > subtropical > arid/polar).
    """
    abs_lat = abs(lat)
    if abs_lat < 15:
        return 0.72    # tropical
    elif abs_lat < 30:
        return 0.55    # subtropical
    elif abs_lat < 50:
        return 0.45    # temperate
    else:
        return 0.25    # boreal / tundra
