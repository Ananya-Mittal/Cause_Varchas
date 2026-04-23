"""
auth/auth_utils.py — JWT creation + verification + password hashing.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return _pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)


# ── Token helpers ─────────────────────────────────────────────────────────────

def create_token(username: str, extra_claims: Optional[dict] = None) -> str:
    """Create a signed JWT with an expiry timestamp."""
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": username, "exp": expire, **(extra_claims or {})}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT.
    Raises jose.JWTError on invalid / expired tokens.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def get_username_from_token(token: str) -> Optional[str]:
    try:
        payload = decode_token(token)
        return payload.get("sub")
    except JWTError:
        return None
