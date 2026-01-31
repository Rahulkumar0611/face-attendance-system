"""Database models for the attendance system."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class AttendanceStatus(str, enum.Enum):
    """Attendance verification status."""
    VERIFIED = "verified"
    REJECTED = "rejected"
    PENDING = "pending"

class Student(Base):
    """Student model."""
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True, index=True)  # Optional email
    enrollment_id = Column(String, unique=True, nullable=False, index=True)
    role = Column(String, nullable=False, default="Student")  # Student, Engineer, Faculty, etc.
    face_encoding_path = Column(String, nullable=True)
    face_encoding_paths = Column(String, nullable=True)  # Semicolon separated list of individual encoding paths
    profile_image_path = Column(String, nullable=True)
    num_face_images = Column(Integer, default=1)
    registered_location_lat = Column(Float, nullable=True)  # GPS from registration image
    registered_location_lon = Column(Float, nullable=True)  # GPS from registration image
    registration_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with cascade delete
    attendances = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Student {self.name} ({self.enrollment_id})>"

class AllowedLocation(Base):
    """Allowed location model for geofencing."""
    __tablename__ = "allowed_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, nullable=False, default=100.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AllowedLocation {self.name}>"

class Attendance(Base):
    """Attendance record model."""
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    location_lat = Column(Float, nullable=False)  # Current location during attendance
    location_lng = Column(Float, nullable=False)
    image_geotag_lat = Column(Float, nullable=True)  # GPS from captured image EXIF
    image_geotag_lon = Column(Float, nullable=True)  # GPS from captured image EXIF
    confidence_score = Column(Float, nullable=False)  # Face match confidence (0-100)
    snapshot_path = Column(String, nullable=True)
    status = Column(Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.PENDING)
    rejection_reason = Column(String, nullable=True)
    
    # Relationship
    student = relationship("Student", back_populates="attendances")
    
    def __repr__(self):
        return f"<Attendance {self.student_id} at {self.timestamp}>"

class Admin(Base):
    """Admin user model for authentication."""
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Admin {self.username}>"

class AttendanceLog(Base):
    """Log of all attendance attempts (success and failures)."""
    __tablename__ = "attendance_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String, nullable=False)  # success, face_mismatch, location_mismatch, etc.
    confidence_score = Column(Float, nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    error_message = Column(String, nullable=True)
    snapshot_path = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<AttendanceLog {self.status} at {self.timestamp}>"

