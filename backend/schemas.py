"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from models import AttendanceStatus

# Student schemas
class StudentCreate(BaseModel):
    """Schema for creating a student."""
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None  # Made optional
    enrollment_id: str = Field(..., min_length=1, max_length=50)

class StudentResponse(BaseModel):
    """Schema for student response."""
    id: int
    name: str
    email: Optional[str] = None  # Made optional
    enrollment_id: str
    role: Optional[str] = "Student"
    profile_image_path: Optional[str] = None
    registered_location_lat: Optional[float] = None
    registered_location_lon: Optional[float] = None
    registration_date: Optional[datetime] = None
    num_face_images: Optional[int] = 1
    created_at: datetime
    
    class Config:
        from_attributes = True

# Location schemas
class LocationData(BaseModel):
    """Schema for location data."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class AllowedLocationResponse(BaseModel):
    """Schema for allowed location response."""
    id: int
    name: str
    latitude: float
    longitude: float
    radius_meters: float
    
    class Config:
        from_attributes = True

# Attendance schemas
class AttendanceMarkRequest(BaseModel):
    """Schema for marking attendance request."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class AttendanceResponse(BaseModel):
    """Schema for attendance response."""
    id: int
    student_id: int
    student_name: Optional[str] = None
    timestamp: datetime
    location_lat: float
    location_lng: float
    image_geotag_lat: Optional[float] = None
    image_geotag_lon: Optional[float] = None
    confidence_score: float
    status: AttendanceStatus
    rejection_reason: Optional[str] = None
    snapshot_path: Optional[str] = None
    
    class Config:
        from_attributes = True

class AttendanceMarkResponse(BaseModel):
    """Schema for attendance marking response."""
    success: bool
    message: str
    attendance: Optional[AttendanceResponse] = None
    student: Optional[StudentResponse] = None

# WebSocket message schemas
class WSMessage(BaseModel):
    """Schema for WebSocket messages."""
    type: str  # "attendance_marked", "student_registered", etc.
    data: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)
