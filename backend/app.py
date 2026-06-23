"""Main FastAPI application for Face Recognition Attendance System."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from database import init_db
from routes import students, attendance, websocket, admin, api
from config import ALLOWED_ORIGINS, DATA_DIR
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    print("✅ Database initialized")
    yield

# Create FastAPI app
app = FastAPI(
    title="Face Recognition Attendance System",
    description="Offline attendance system with face recognition and location verification",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(websocket.router)
app.include_router(admin.router)
app.include_router(api.router)

# Serve static files (images)
app.mount("/data", StaticFiles(directory=str(DATA_DIR)), name="data")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Face Recognition Attendance System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
