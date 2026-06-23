from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import numpy as np

# We import the existing face recognition logic!
from utils.face_recognition import generate_face_encoding, match_face

router = APIRouter(prefix="/api/face", tags=["Face Recognition"])

class RecognizeRequest(BaseModel):
    known_encodings: Dict[str, List[float]] # { "studentId": [128-float-array] }

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "face-ai"}

@router.post("/register-face")
async def register_face(image: UploadFile = File(...)):
    """Extracts 128-dim encoding from an image."""
    image_bytes = await image.read()
    encoding = generate_face_encoding(image_bytes, num_jitters=10)
    
    if encoding is None:
        raise HTTPException(status_code=400, detail="No face detected")
        
    return {"encoding": encoding.tolist()}

@router.post("/recognize-face")
async def recognize_face(
    image: UploadFile = File(...),
    known_encodings_json: str = Form(...) 
):
    """Matches an image against a list of known encodings."""
    try:
        known_data = json.loads(known_encodings_json)
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON for encodings")

    image_bytes = await image.read()
    captured_encoding = generate_face_encoding(image_bytes, num_jitters=1)
    
    if captured_encoding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    # Format for match_face utility: [(student_id, [encodings]), ...]
    formatted_encodings = [
        (student_id, [np.array(encoding)]) 
        for student_id, encoding in known_data.items()
    ]
    
    match_result = match_face(captured_encoding, formatted_encodings)
    
    if match_result:
        student_id, confidence = match_result
        return {"matched": True, "studentId": student_id, "confidence": confidence}
        
    return {"matched": False, "studentId": None, "confidence": 0}
