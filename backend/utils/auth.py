"""Authentication utilities for admin users."""
import jwt
import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional
from config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_HOURS


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2 with SHA-256."""
    # Generate a random salt
    salt = os.urandom(32)
    # Hash the password with the salt
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    # Store salt and hash together
    return salt.hex() + pwd_hash.hex()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        # Extract salt (first 64 hex chars = 32 bytes)
        salt = bytes.fromhex(hashed_password[:64])
        # Extract stored hash
        stored_hash = hashed_password[64:]
        # Hash the provided password with the same salt
        pwd_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        # Compare hashes
        return pwd_hash.hex() == stored_hash
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
