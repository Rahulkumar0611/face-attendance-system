"""Configuration settings for the Face Recognition Attendance System."""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Database
DATABASE_URL = f"sqlite+aiosqlite:///{BASE_DIR}/attendance.db"

# File storage paths
DATA_DIR = BASE_DIR / "data"
FACE_ENCODINGS_DIR = DATA_DIR / "face_encodings"
PROFILE_IMAGES_DIR = DATA_DIR / "profile_images"
ATTENDANCE_SNAPSHOTS_DIR = DATA_DIR / "attendance_snapshots"

# Ensure directories exist
for directory in [FACE_ENCODINGS_DIR, PROFILE_IMAGES_DIR, ATTENDANCE_SNAPSHOTS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Face recognition settings
FACE_RECOGNITION_TOLERANCE = 0.5  # Lower is more strict (0.0 - 1.0)
FACE_CONFIDENCE_THRESHOLD = 0.5   # Minimum confidence to accept match

# Location settings - Default allowed locations (can be modified)
ALLOWED_LOCATIONS = []

# CORS settings
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# WebSocket settings
WS_HEARTBEAT_INTERVAL = 30  # seconds

# Attendance rules
MAX_ATTENDANCE_PER_DAY = 1

# Geotag verification
GEOTAG_MATCH_THRESHOLD_METERS = 100  # Max distance for location match
GEOTAG_REQUIRED = False  # Set to True to require geotag in images

# Admin authentication
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Face detection display
BOUNDING_BOX_COLOR = (0, 255, 0)  # Green (BGR format for OpenCV)
TEXT_COLOR = (0, 255, 255)  # Cyan
TEXT_BACKGROUND_COLOR = (0, 0, 0)  # Black
FONT_SCALE = 0.6
FONT_THICKNESS = 2

