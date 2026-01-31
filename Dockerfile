# Use a base image with dlib and face_recognition pre-installed
FROM animcogn/face_recognition:cpu

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy Optimized HF requirements
COPY backend/requirements_hf.txt requirements.txt

# Install dependencies with verbose output to debug failure
RUN pip install --no-cache-dir -v -r requirements.txt

# Copy the entire backend code
COPY backend/ .

# Create necessary directories for persistence
RUN mkdir -p data/faces data/attendance_snapshots

# Expose port 7860
EXPOSE 7860

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
