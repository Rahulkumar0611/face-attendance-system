# Use a base image with dlib and face_recognition pre-installed
# This avoids the memory-intensive compilation step that fails on Hugging Face
FROM animcogn/face_recognition:cpu

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV (libgl1)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip (good practice)
RUN pip install --no-cache-dir --upgrade pip

# Copy backend requirements
COPY backend/requirements.txt requirements.txt

# Filter out face-recognition from requirements.txt because it's already in the base image
# This prevents pip from trying to compile/reinstall it
RUN grep -v "face-recognition" requirements.txt > requirements_final.txt

# Install remaining dependencies from filtered requirements
RUN pip install --no-cache-dir -r requirements_final.txt

# Copy the entire backend code
COPY backend/ .

# Create necessary directories for persistence
RUN mkdir -p data/faces data/attendance_snapshots

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
