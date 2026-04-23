@echo off
REM setup_backend.bat — Windows version
REM Run: setup_backend.bat

echo.
echo  Varchas Backend Setup (Windows)
echo ===================================

REM Check Python
echo [1/6] Checking Python...
python --version >nul 2>&1
IF ERRORLEVEL 1 (
  echo ERROR: Python not found. Install from https://python.org
  pause & exit /b 1
)
python --version

REM Create venv
echo.
echo [2/6] Creating virtual environment...
IF NOT EXIST "venv" (
  python -m venv venv
  echo   Created venv
) ELSE (
  echo   venv already exists
)
call venv\Scripts\activate.bat

REM Install deps
echo.
echo [3/6] Installing dependencies...
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo   All packages installed

REM Create .env
echo.
echo [4/6] Checking .env...
IF NOT EXIST ".env" (
  (
    echo SECRET_KEY=varchas_dev_secret_change_in_production_xyz789
    echo ALGORITHM=HS256
    echo ACCESS_TOKEN_EXPIRE_HOURS=4
    echo DATABASE_URL=sqlite:///./agri_credit.db
    echo GEE_PROJECT_ID=agricultural-land-486413
    echo MODEL_PATH=ml/model.pkl
    echo FEATURES_PATH=ml/features.pkl
  ) > .env
  echo   .env created
) ELSE (
  echo   .env already exists
)

REM Train model
echo.
echo [5/6] Training ML model (30 seconds)...
if not exist "ml" mkdir ml
python -m ml.train_model
echo   model.pkl saved

echo.
echo ==========================================
echo  Setup Complete!
echo ==========================================
echo.
echo To start the server:
echo   venv\Scripts\activate
echo   python -m uvicorn app:app --host 0.0.0.0 --port 5000 --reload
echo.
echo API Docs: http://localhost:5000/docs
echo.
echo For GEE satellite data (first time):
echo   python -c "import ee; ee.Authenticate()"
echo.
pause
