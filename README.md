# Cause_Varchas
# 🌾 Varchas — Agri Credit AI

> **ML-powered agricultural credit scoring for smallholder farmers.**
> Built with FastAPI + React Native (Expo) + Google Earth Engine + Open-Meteo.

---

## 📋 Table of Contents
1. [What It Does](#what-it-does)
2. [How It Works — Full Flow](#how-it-works)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Connecting Frontend ↔ Backend](#connecting-frontend--backend)
8. [API Reference](#api-reference)
9. [ML Model Explained](#ml-model-explained)
10. [Troubleshooting](#troubleshooting)

---

## What It Does

Varchas helps banks and microfinance institutions assess loan eligibility for farmers — without requiring paperwork. A farmer just enters their GPS coordinates and crop type. The system then:

- Fetches **satellite crop health** (NDVI) from Google Earth Engine
- Fetches **live weather** (rainfall, temperature) from Open-Meteo
- Runs an **ML ensemble model** to generate a credit score 0–100
- Decides: **Approve / Conditional / Manual Review / Reject**
- Calculates a **loan limit** based on estimated farm revenue
- Explains the score with **human-readable factors**

---

## How It Works

```
FARMER APP (Expo)
      │
      │  POST /credit-score  {lat, lon, crop, area_ha, crop_age}
      ▼
FASTAPI BACKEND
      ├── 1. Google Earth Engine → NDVI (satellite vegetation index)
      ├── 2. Open-Meteo API     → rainfall (mm), temperature (°C)
      ├── 3. Random (placeholder) → soil moisture 0–1
      ├── 4. yield_calc.py      → estimated yield (tons/ha)
      ├── 5. yield_calc.py      → estimated revenue (₹)
      ├── 6. ML Ensemble Model  → credit score 0–100
      │       ├── RandomForestRegressor  (300 trees)
      │       └── GradientBoostingRegressor (300 estimators)
      ├── 7. loan.py            → loan limit + Approve/Reject decision
      ├── 8. explain.py         → human-readable factor list
      └── 9. SQLite DB          → persist evaluation record
      │
      │  Response: score, decision, loan_limit, factors, ...
      ▼
FARMER APP
      └── ResultScreen: animated score ring + all details
```

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Mobile App  | React Native + Expo Go              |
| Navigation  | React Navigation (Stack + Tabs)     |
| HTTP Client | Axios                               |
| Storage     | AsyncStorage (JWT persistence)      |
| Backend     | FastAPI (Python)                    |
| Database    | SQLite via SQLAlchemy               |
| Auth        | JWT (python-jose) + bcrypt passwords|
| ML Model    | scikit-learn VotingRegressor        |
| Satellite   | Google Earth Engine (Sentinel-2)    |
| Weather     | Open-Meteo (free, no API key)       |

---

## Project Structure

```
varchas/
│
├── backend/                        ← FastAPI server
│   ├── app.py                      ← Main entry point, all routes
│   ├── config.py                   ← Env vars, crop prices
│   ├── requirements.txt
│   │
│   ├── auth/
│   │   ├── auth_utils.py           ← JWT create/verify, bcrypt hash
│   │   └── router.py               ← /auth/register, /auth/login
│   │
│   ├── database/
│   │   ├── db.py                   ← SQLAlchemy engine + session
│   │   └── models.py               ← Farmer, Evaluation ORM models
│   │
│   ├── ml/
│   │   ├── train_model.py          ← Train + save model (run once)
│   │   ├── predict_model.py        ← Load model + predict_score()
│   │   ├── model.pkl               ← Saved ensemble pipeline
│   │   └── features.pkl            ← Feature name list
│   │
│   ├── schemas/
│   │   └── schemas.py              ← Pydantic request/response models
│   │
│   └── services/
│       ├── satellite.py            ← GEE NDVI fetch + LRU cache
│       ├── weather.py              ← Open-Meteo rainfall + temp
│       ├── yield_calc.py           ← Yield + revenue estimation
│       ├── loan.py                 ← Loan limit + decision tiers
│       └── explain.py              ← Score factor explanations
│
└── frontend/                       ← Expo React Native app
    ├── App.tsx                     ← Root component
    ├── app.json                    ← Expo config
    ├── package.json
    │
    └── src/
        ├── api/
        │   └── client.ts           ← Axios instance + all API calls
        │
        ├── navigation/
        │   └── AppNavigator.tsx    ← Stack + bottom tab routing
        │
        ├── screens/
        │   ├── SplashScreen.tsx    ← Animated logo (2.4s)
        │   ├── LoginScreen.tsx     ← Phone + password login
        │   ├── RegisterScreen.tsx  ← New farmer registration
        │   ├── HomeScreen.tsx      ← GPS + crop form
        │   ├── ResultScreen.tsx    ← Animated score ring + details
        │   ├── HistoryScreen.tsx   ← Past evaluations list
        │   └── ProfileScreen.tsx   ← Stats + logout
        │
        ├── components/
        │   ├── ScoreRing.tsx       ← SVG animated ring
        │   └── index.ts            ← MetricCard, StatusPill, FactorItem
        │
        ├── theme/
        │   └── colors.ts           ← Design tokens (colors, spacing, radius)
        │
        └── types/
            └── index.ts            ← TypeScript interfaces
```

---

## Backend Setup

### Prerequisites
- Python 3.10+
- Google Earth Engine account (free at earthengine.google.com)

### Install & Run

```bash
# 1. Navigate to backend folder
cd backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file (copy and edit)
cp .env.example .env
# Edit .env:  GEE_PROJECT_ID=your-project-id
#             SECRET_KEY=your-secret-key-here

# 5. Authenticate Google Earth Engine (ONCE only)
python -c "import ee; ee.Authenticate()"
# Follow the browser link, paste the token

# 6. Train the ML model (ONCE only — takes ~30 seconds)
python -m ml.train_model
# Output: MAE, R², CV R², saves model.pkl + features.pkl

# 7. Start the server
python -m uvicorn app:app --host 0.0.0.0 --port 5000 --reload
#                            ↑ 0.0.0.0 is required for phone access

# ✅ Server running at http://localhost:5000
# ✅ Swagger UI at  http://localhost:5000/docs
```

### Environment Variables (`.env`)
```env
SECRET_KEY=replace_this_with_a_long_random_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=4
DATABASE_URL=sqlite:///./agri_credit.db
GEE_PROJECT_ID=your-google-earth-engine-project-id
```

---

## Frontend Setup

### Prerequisites
- Node.js 18+
- Expo Go app installed on your phone (from Play Store / App Store)

### Install & Run

```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Set your PC's LAN IP in src/api/client.ts
#    Change:  export const BASE_URL = 'http://192.168.29.72:5000';
#    To:      export const BASE_URL = 'http://YOUR_PC_IP:5000';
#    Find IP: Windows → ipconfig   Mac → ifconfig | grep inet

# 4. Start Expo
npx expo start

# 5. Scan the QR code with Expo Go on your phone
#    (Phone must be on same WiFi as PC)
```

---

## Connecting Frontend ↔ Backend

The **only file** you edit to connect them is `src/api/client.ts`:

```ts
export const BASE_URL = 'http://192.168.29.72:5000';
//                               ↑
//                    Replace with YOUR PC's LAN IP
```

| Scenario              | BASE_URL to use                  |
|-----------------------|----------------------------------|
| Expo Go on phone      | `http://192.168.x.x:5000`        |
| Android Emulator      | `http://10.0.2.2:5000`           |
| iOS Simulator         | `http://localhost:5000`          |
| Production            | `https://your-domain.com`        |

**Test the connection first:**
Open your phone's browser → `http://YOUR_PC_IP:5000/health`
Should show: `{"status":"ok","version":"2.0.0"}`

---

## API Reference

### Auth

| Method | Endpoint         | Body                             | Returns              |
|--------|------------------|----------------------------------|----------------------|
| POST   | /auth/register   | `{name, phone, password}`        | `{message, farmer_id}` |
| POST   | /auth/login      | form: `username=phone&password=` | `{access_token, farmer_name}` |

### Credit

| Method | Endpoint       | Body / Params                              | Returns           |
|--------|----------------|--------------------------------------------|-------------------|
| POST   | /credit-score  | `{lat, lon, crop, area_ha, crop_age}`      | Full CreditResponse |
| GET    | /history       | `?limit=15`                                | Array of evaluations |
| GET    | /health        | —                                          | `{status, version}` |

### Credit Score Response Shape
```json
{
  "score": 72,
  "decision": "Conditional",
  "risk_tier": "Moderate Risk",
  "loan_limit": 38000,
  "revenue": 88000,
  "estimated_yield": "3.2 t/ha",
  "ndvi": 0.62,
  "rainfall_mm": 5.4,
  "temp_c": 29.5,
  "crop_health": "Good",
  "weather_status": "Normal",
  "soil_status": "Dry Soil",
  "factors": [
    {"factor":"Crop Vegetation","status":"Good","impact":"positive","detail":"NDVI 0.62 — healthy crop growth"},
    ...
  ],
  "evaluation_id": 42
}
```

---

## ML Model Explained

### Features (9 total)
| Feature       | Source          | Description                        |
|---------------|-----------------|------------------------------------|
| ndvi          | Google Earth Engine | Satellite vegetation index 0–1 |
| rainfall      | Open-Meteo      | Total rainfall last 24h (mm)       |
| soil          | Placeholder     | Soil moisture fraction 0–1         |
| yield_est     | yield_calc.py   | Estimated yield (tons/ha)          |
| temp          | Open-Meteo      | Mean temperature (°C)              |
| crop_age      | User input      | Season fraction elapsed 0–1        |
| flood_risk    | Derived         | 1 if rainfall > 12mm               |
| drought_risk  | Derived         | 1 if rainfall < 2mm                |
| ndvi_x_soil   | Derived         | NDVI × soil (interaction feature)  |

### Model Architecture
```
Input (9 features)
    │
    ▼
StandardScaler (normalise all features)
    │
    ▼
VotingRegressor (average of 2 models)
    ├── RandomForestRegressor  (300 trees, max_depth=12)
    └── GradientBoostingRegressor (300 est., lr=0.05, max_depth=5)
    │
    ▼
Score clipped to [0, 100]
```

### Scoring Formula (training labels)
```
score = ndvi×35 + rainfall×1.5 + soil×22 + yield×5
      + crop_age×5 + ndvi×soil×10
      - flood_risk×15 - drought_risk×12
      - heat_stress×1.5  (temp > 35°C penalty)
      + noise(0, 2)
```

### Decision Tiers
| Score   | Decision       | Loan Limit            |
|---------|----------------|-----------------------|
| ≥ 75    | Approve        | 80% of revenue (min ₹50k) |
| 55–74   | Conditional    | 60% of revenue (min ₹20k) |
| 40–54   | Manual Review  | 0 (human decides)     |
| < 40    | Reject         | 0                     |

---

## Troubleshooting

### "Network Error" on phone
1. Open phone browser → `http://YOUR_IP:5000/health`
2. If no response → run uvicorn with `--host 0.0.0.0` (not default)
3. Windows Firewall → allow port 5000 inbound
4. Phone + PC must be on same WiFi

### "Invalid credentials" on login
- FastAPI OAuth2 expects `application/x-www-form-urlencoded`
- Make sure `formData.toString()` is used in client.ts (not bare URLSearchParams)

### GEE returns 0.0 NDVI
- Run `python -c "import ee; ee.Authenticate()"` again
- Check your project ID in `.env`
- App still works — falls back to latitude-based heuristic

### Model not found (model.pkl missing)
```bash
cd backend
python -m ml.train_model
```

### Metro bundler cache issue
```bash
npx expo start --clear
```
