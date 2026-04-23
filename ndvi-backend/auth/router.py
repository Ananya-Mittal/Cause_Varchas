"""
auth/router.py — Login & registration endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session
import re

from auth.auth_utils import create_token, hash_password, verify_password, get_username_from_token
from database.db import get_db
from database.models import Farmer

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    phone: str
    password: str

    @validator("phone")
    def validate_phone(cls, v):
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Phone must be exactly 10 digits")
        return v

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer_name: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Farmer).filter(Farmer.phone == req.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    farmer = Farmer(
        name=req.name,
        phone=req.phone,
        hashed_password=hash_password(req.password),
    )
    db.add(farmer)
    db.commit()
    return {"message": "Registration successful", "farmer_id": farmer.id}


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.phone == form.username).first()
    if not farmer or not verify_password(form.password, farmer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_token(farmer.phone, {"name": farmer.name})
    return TokenResponse(access_token=token, farmer_name=farmer.name)


# ── Dependency for protected routes ──────────────────────────────────────────

def get_current_farmer(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Farmer:
    phone = get_username_from_token(token)
    if not phone:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    farmer = db.query(Farmer).filter(Farmer.phone == phone).first()
    if not farmer:
        raise HTTPException(status_code=401, detail="Farmer not found")
    return farmer
