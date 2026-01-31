# Use Python 3.9 (Better compatibility for dlib/face_recognition wheels)
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies for dlib and opencv
# We need build-essential and cmake for dlib compilation
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libgl1 \
    libglib2.0-0 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install core heavy dependencies separately to avoid cache busts and timeouts
# Pre-install cmake and numpy to facilitate dlib build
RUN pip install --no-cache-dir cmake numpy

# Install dlib explicitly first (this is the heaviest step)
# Using verbose to see logs if it fails
RUN pip install --no-cache-dir dlib

# Copy backend requirements
COPY backend/requirements.txt requirements.txt

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend code
COPY backend/ .

# Create necessary directories for persistence
RUN mkdir -p data/faces data/attendance_snapshots

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
