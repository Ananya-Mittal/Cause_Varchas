"""
Improved ML Model Training for Agri Credit Scoring
Uses ensemble methods + feature engineering + proper validation
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, VotingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

np.random.seed(42)
N = 5000  # more samples

# ── Feature generation ──────────────────────────────────────────────────────
ndvi          = np.random.uniform(0.1, 0.95, N)
rainfall      = np.random.uniform(0, 20, N)
soil          = np.random.uniform(0.1, 1.0, N)
yield_est     = np.random.uniform(0.5, 6.0, N)
temp          = np.random.uniform(15, 42, N)       # °C
crop_age      = np.random.uniform(0.1, 1.0, N)    # fraction of season elapsed
flood_risk    = (rainfall > 12).astype(float)
drought_risk  = (rainfall < 2).astype(float)
ndvi_x_soil   = ndvi * soil                        # interaction term

# ── Label generation (domain-informed formula) ──────────────────────────────
# Penalise flood/drought, reward good ndvi + soil + yield
raw_score = (
    ndvi          * 35
    + rainfall    *  1.5
    + soil        * 22
    + yield_est   *  5
    + crop_age    *  5
    - flood_risk  * 15
    - drought_risk * 12
    - np.clip((temp - 35), 0, None) * 1.5   # heat stress penalty
    + ndvi_x_soil * 10
    + np.random.normal(0, 2, N)              # realistic noise
)

score = np.clip(raw_score, 0, 100)

df = pd.DataFrame({
    "ndvi":         ndvi,
    "rainfall":     rainfall,
    "soil":         soil,
    "yield_est":    yield_est,
    "temp":         temp,
    "crop_age":     crop_age,
    "flood_risk":   flood_risk,
    "drought_risk": drought_risk,
    "ndvi_x_soil":  ndvi_x_soil,
    "score":        score,
})

FEATURES = ["ndvi", "rainfall", "soil", "yield_est",
            "temp", "crop_age", "flood_risk", "drought_risk", "ndvi_x_soil"]

X = df[FEATURES]
y = df["score"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── Ensemble model ───────────────────────────────────────────────────────────
rf = RandomForestRegressor(n_estimators=300, max_depth=12,
                           min_samples_leaf=5, random_state=42, n_jobs=-1)
gb = GradientBoostingRegressor(n_estimators=300, learning_rate=0.05,
                                max_depth=5, subsample=0.8, random_state=42)

ensemble = VotingRegressor([("rf", rf), ("gb", gb)])

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model",  ensemble),
])

pipeline.fit(X_train, y_train)

# ── Evaluation ───────────────────────────────────────────────────────────────
preds = pipeline.predict(X_test)
mae   = mean_absolute_error(y_test, preds)
r2    = r2_score(y_test, preds)
cv    = cross_val_score(pipeline, X, y, cv=5, scoring="r2")

print(f"MAE : {mae:.2f}")
print(f"R²  : {r2:.4f}")
print(f"CV R²: {cv.mean():.4f} ± {cv.std():.4f}")

os.makedirs("ml", exist_ok=True)
joblib.dump(pipeline, "ml/model.pkl")
joblib.dump(FEATURES,  "ml/features.pkl")
print("Model + feature list saved to ml/")
