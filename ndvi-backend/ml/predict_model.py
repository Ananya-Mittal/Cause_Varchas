"""
Prediction module — loads the ensemble pipeline and exposes predict_score().
"""

import numpy as np
import joblib
import os

_MODEL_PATH    = os.path.join(os.path.dirname(__file__), "model.pkl")
_FEATURES_PATH = os.path.join(os.path.dirname(__file__), "features.pkl")

_pipeline = None
_features  = None


def _load():
    global _pipeline, _features
    if _pipeline is None:
        _pipeline = joblib.load(_MODEL_PATH)
        _features  = joblib.load(_FEATURES_PATH)


def predict_score(
    ndvi: float,
    rainfall: float,
    soil: float,
    yield_est: float,
    temp: float = 28.0,
    crop_age: float = 0.5,
) -> float:

    _load()

    # ── FIX 1: smooth rainfall (prevents extreme collapse at 0) ──
    rainfall = max(rainfall, 0.5)

    # ── FIX 2: softer risk scaling instead of binary 0/1 ──
    flood_risk   = min(rainfall / 15.0, 1.0)   # gradual risk
    drought_risk = max(0.0, (2.0 - rainfall) / 2.0)

    # ── FIX 3: stronger agronomy signal ──
    ndvi_x_soil  = ndvi * soil

    row = np.array([[
        ndvi,
        rainfall,
        soil,
        yield_est,
        temp,
        crop_age,
        flood_risk,
        drought_risk,
        ndvi_x_soil,
    ]])

    import pandas as pd
    X = pd.DataFrame(row, columns=_features)

    raw = _pipeline.predict(X)[0]

    return round(float(np.clip(raw, 0, 100)), 2)
