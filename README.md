# 🎯 Face Attendance System

An advanced AI-powered attendance management system using facial recognition technology. Built with FastAPI backend and React frontend, featuring real-time face detection, geolocation verification, and a beautiful glassmorphism UI.

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core Features
- 🔐 **Face Recognition** - Advanced dlib-based facial recognition with 128-dimension face encodings
- 📍 **Geolocation Verification** - GPS-based location tracking for attendance validation
- 📊 **Real-time Dashboard** - Live attendance stats with beautiful glassmorphism UI
- 👤 **Student Management** - Register, edit, delete students with multiple face images
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

### Technical Features
- ⚡ **Async Backend** - FastAPI with async SQLAlchemy for high performance
- 🔄 **WebSocket Support** - Real-time updates without page refresh
- 🐳 **Docker Ready** - Easy deployment with Docker/Hugging Face Spaces
- 🔒 **Admin Authentication** - Secure JWT-based admin panel access

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python, FastAPI, SQLAlchemy, dlib, face_recognition |
| **Frontend** | React, Vite, TailwindCSS, Framer Motion |
| **Database** | SQLite (async with aiosqlite) |
| **Face Detection** | dlib + face_recognition library |
| **Deployment** | Docker, Hugging Face Spaces |

## 📦 Project Structure

```
face-attendance-system/
├── backend/
│   ├── app.py              # FastAPI application entry
│   ├── config.py           # Configuration settings
│   ├── database.py         # Database setup
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── routes/
│   │   ├── admin.py        # Admin authentication
│   │   ├── attendance.py   # Attendance marking/recognition
│   │   ├── students.py     # Student CRUD operations
│   │   └── websocket.py    # WebSocket connections
│   ├── utils/
│   │   ├── auth.py         # JWT authentication
│   │   ├── face_recognition.py  # Face detection/encoding
│   │   ├── location.py     # Geolocation utilities
│   │   └── storage.py      # File storage handlers
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utility functions
│   └── package.json
├── Dockerfile              # Hugging Face deployment
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- CMake (for dlib compilation)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app:app --reload --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 🌐 Deployment

### Hugging Face Spaces (Backend)

1. Create a new Space on Hugging Face with Docker SDK
2. Push the backend with Dockerfile:

```bash
git push https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE main
```

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variable:
   ```
   VITE_API_URL=https://your-space.hf.space
   ```
3. Deploy!

## 📱 Usage

### Student Registration
1. Navigate to the Dashboard
2. Click "Register Student"
3. Fill in student details (Name, ID)
4. Capture multiple face images (recommended: 3-5)
5. Submit registration

### Mark Attendance
1. Open the Dashboard
2. Enable camera and location access
3. Position your face in the frame
4. Click "Capture & Mark Attendance"
5. System verifies face and location

### Admin Panel
1. Click "Admin" button
2. Login with credentials (default: admin/admin123)
3. Manage students, view attendance history
4. Reset attendance records as needed

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/students/register` | POST | Register new student |
| `/api/students/` | GET | List all students |
| `/api/students/{id}` | PUT/DELETE | Update/Delete student |
| `/api/attendance/mark` | POST | Mark attendance |
| `/api/attendance/recognize` | POST | Real-time face recognition |
| `/api/attendance/today` | GET | Today's attendance |
| `/api/attendance/stats` | GET | Attendance statistics |
| `/api/admin/login` | POST | Admin authentication |

## 🔧 Configuration

### Environment Variables

**Backend (`backend/config.py`):**
```python
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:8000
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mohammad Fayas Khan**

- GitHub: [@MohammadFayasKhan](https://github.com/MohammadFayasKhan)
- LinkedIn: [Mohammad Fayas Khan](https://www.linkedin.com/in/fayas-khan-fk/)

---

<p align="center">
  Made with ❤️ using AI-powered Face Recognition
</p>
