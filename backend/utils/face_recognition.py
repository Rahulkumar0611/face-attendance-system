"""Face recognition utilities using face_recognition library."""
import face_recognition
import numpy as np
import pickle
from pathlib import Path
from typing import Optional, Tuple, List
import cv2
from PIL import Image
import io
from config import FACE_ENCODINGS_DIR, FACE_RECOGNITION_TOLERANCE

def generate_face_encoding(image_data: bytes, num_jitters: int = 1) -> Optional[np.ndarray]:
    """
    Generate face encoding from image data.
    
    Args:
        image_data: Image bytes
        num_jitters: How many times to re-sample the face when calculating encoding.
                    Higher is more accurate but slower. (Default: 1)
        
    Returns:
        Face encoding array or None if no face detected
    """
    try:
        print(f"[DEBUG] Attempting to decode image, size: {len(image_data)} bytes")
        
        # Use face_recognition's official image loading method
        import io
        image_file = io.BytesIO(image_data)
        
        try:
            rgb_image = face_recognition.load_image_file(image_file)
            print(f"[DEBUG] face_recognition.load_image_file succeeded: shape={rgb_image.shape}, dtype={rgb_image.dtype}")
        except Exception as load_error:
            print(f"[ERROR] face_recognition.load_image_file failed: {load_error}")
            from PIL import Image as PILImage
            image_file.seek(0)
            pil_image = PILImage.open(image_file)
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            rgb_image = np.asarray(pil_image, dtype=np.uint8, order='C')
            if not rgb_image.flags['C_CONTIGUOUS']:
                rgb_image = np.ascontiguousarray(rgb_image, dtype=np.uint8)
        
        print("[DEBUG] Attempting face detection...")
        # Detect face locations - try with both HOG (default) and CNN models
        try:
            face_locations = face_recognition.face_locations(rgb_image, model="hog")
            print(f"[DEBUG] HOG face detection found {len(face_locations)} faces")
        except Exception as hog_error:
            print(f"[WARNING] HOG detection failed: {hog_error}, trying CNN...")
            try:
                face_locations = face_recognition.face_locations(rgb_image, model="cnn")
                print(f"[DEBUG] CNN face detection found {len(face_locations)} faces")
            except Exception as cnn_error:
                print(f"[ERROR] CNN detection also failed: {cnn_error}")
                return None
        
        if not face_locations:
            print("[WARNING] No face locations detected in image")
            return None
        
        print(f"[DEBUG] Generating face encodings with num_jitters={num_jitters}...")
        # Get face encodings (use first face if multiple detected)
        # num_jitters > 1 helps in getting a more stable encoding
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations, num_jitters=num_jitters)
        
        if not face_encodings:
            print("[WARNING] Face locations found but encoding generation failed")
            return None
        
        print(f"[SUCCESS] Face encoding generated successfully, shape: {face_encodings[0].shape}")
        return face_encodings[0]
        
    except Exception as e:
        print(f"[ERROR] Exception in generate_face_encoding: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None

def save_face_encoding(student_id: int, encoding: np.ndarray) -> str:
    """
    Save face encoding to pickle file.
    
    Args:
        student_id: Student ID
        encoding: Face encoding array
        
    Returns:
        Path to saved encoding file
    """
    file_path = FACE_ENCODINGS_DIR / f"student_{student_id}.pkl"
    
    with open(file_path, 'wb') as f:
        pickle.dump(encoding, f)
    
    return str(file_path)

def load_face_encoding(file_path: str) -> Optional[np.ndarray]:
    """
    Load face encoding from pickle file.
    
    Args:
        file_path: Path to encoding file
        
    Returns:
        Face encoding array or None if error
    """
    try:
        with open(file_path, 'rb') as f:
            encoding = pickle.load(f)
        return encoding
    except Exception as e:
        print(f"Error loading face encoding: {e}")
        return None

def load_all_face_encodings() -> List[Tuple[int, List[np.ndarray]]]:
    """
    Load all face encodings from the encodings directory.
    Groups multiple encodings by student_id.
    
    Returns:
        List of tuples (student_id, list_of_encodings)
    """
    student_encodings = {}
    
    # First, load individual encodings (student_{id}_image_{i}.pkl)
    for file_path in FACE_ENCODINGS_DIR.glob("student_*_image_*.pkl"):
        try:
            # Extract student ID from filename: student_123_image_0.pkl
            student_id = int(file_path.stem.split('_')[1])
            encoding = load_face_encoding(str(file_path))
            
            if encoding is not None:
                if student_id not in student_encodings:
                    student_encodings[student_id] = []
                student_encodings[student_id].append(encoding)
        except Exception as e:
            print(f"Error loading encoding from {file_path}: {e}")
            continue
            
    # Then ensure we also have the main/averaged encodings if any exist without individual ones
    for file_path in FACE_ENCODINGS_DIR.glob("student_*.pkl"):
        if "_image_" in file_path.name:
            continue
            
        try:
            student_id = int(file_path.stem.split('_')[1])
            if student_id not in student_encodings:
                encoding = load_face_encoding(str(file_path))
                if encoding is not None:
                    student_encodings[student_id] = [encoding]
        except Exception as e:
            print(f"Error loading individual encoding from {file_path}: {e}")
            continue
    
    return list(student_encodings.items())

def match_face(captured_encoding: np.ndarray, 
               known_encodings: List[Tuple[int, List[np.ndarray]]],
               tolerance: float = FACE_RECOGNITION_TOLERANCE) -> Optional[Tuple[int, float]]:
    """
    Match captured face encoding against known encodings.
    Matches against all available encodings for each student.
    
    Args:
        captured_encoding: Face encoding from captured image
        known_encodings: List of (student_id, list_of_encodings) tuples
        tolerance: Face matching tolerance (lower is stricter)
        
    Returns:
        Tuple of (student_id, confidence_score) or None if no match
    """
    if not known_encodings:
        return None
    
    best_overall_match_id = None
    best_overall_distance = float('inf')
    
    for student_id, student_encoding_list in known_encodings:
        # Calculate face distances for all encodings of this student
        distances = face_recognition.face_distance(student_encoding_list, captured_encoding)
        
        if len(distances) > 0:
            min_distance = np.min(distances)
            
            if min_distance < best_overall_distance:
                best_overall_distance = min_distance
                best_overall_match_id = student_id
    
    # Check if best match is within tolerance
    if best_overall_distance <= tolerance:
        # Convert distance to confidence score (0-1, higher is better)
        confidence = 1.0 - best_overall_distance
        return (best_overall_match_id, confidence)
    
    return None

def detect_face_in_image(image_data: bytes) -> bool:
    """
    Check if image contains at least one face.
    
    Args:
        image_data: Image bytes
        
    Returns:
        True if face detected, False otherwise
    """
    try:
        print(f"[DEBUG] detect_face_in_image: Received {len(image_data)} bytes")
        
        # Use face_recognition's official image loading method
        # This handles all the image format conversions internally
        import io
        import tempfile
        
        # face_recognition.load_image_file expects a file path or file object
        # Create a temporary file-like object
        image_file = io.BytesIO(image_data)
        
        try:
            # Use the official face_recognition image loader
            rgb_image = face_recognition.load_image_file(image_file)
            print(f"[DEBUG] face_recognition.load_image_file succeeded: shape={rgb_image.shape}, dtype={rgb_image.dtype}")
        except Exception as load_error:
            print(f"[ERROR] face_recognition.load_image_file failed: {load_error}")
            # Fallback to PIL
            from PIL import Image as PILImage
            image_file.seek(0)
            pil_image = PILImage.open(image_file)
            print(f"[DEBUG] PIL fallback: mode={pil_image.mode}, size={pil_image.size}")
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            rgb_image = np.asarray(pil_image, dtype=np.uint8, order='C')
            if not rgb_image.flags['C_CONTIGUOUS']:
                rgb_image = np.ascontiguousarray(rgb_image, dtype=np.uint8)
        
        print(f"[DEBUG] Final image - shape: {rgb_image.shape}, dtype: {rgb_image.dtype}, contiguous: {rgb_image.flags['C_CONTIGUOUS']}")
        
        face_locations = face_recognition.face_locations(rgb_image)
        print(f"[DEBUG] detect_face_in_image: Found {len(face_locations)} faces")
        return len(face_locations) > 0
        
    except Exception as e:
        print(f"Error detecting face: {e}")
        import traceback
        traceback.print_exc()
        return False

def detect_face_with_box(image_data: bytes) -> Optional[Tuple[np.ndarray, Tuple[int, int, int, int]]]:
    """
    Detect face and return image with bounding box coordinates.
    
    Args:
        image_data: Image bytes
        
    Returns:
        Tuple of (face_encoding, (top, right, bottom, left)) or None if no face
    """
    try:
        # Use face_recognition's official image loading method
        import io
        image_file = io.BytesIO(image_data)
        
        try:
            rgb_image = face_recognition.load_image_file(image_file)
        except Exception as load_error:
            from PIL import Image as PILImage
            image_file.seek(0)
            pil_image = PILImage.open(image_file)
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            rgb_image = np.asarray(pil_image, dtype=np.uint8, order='C')
            if not rgb_image.flags['C_CONTIGUOUS']:
                rgb_image = np.ascontiguousarray(rgb_image, dtype=np.uint8)
        
        # Detect face locations
        face_locations = face_recognition.face_locations(rgb_image)
        
        if not face_locations:
            return None
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        if not face_encodings:
            return None
        
        # Return first face encoding and location
        return (face_encodings[0], face_locations[0])
        
    except Exception as e:
        print(f"Error detecting face with box: {e}")
        return None

def match_face_with_info(
    captured_encoding: np.ndarray,
    known_encodings: List[Tuple[int, List[np.ndarray]]],
    student_info_dict: dict,
    tolerance: float = FACE_RECOGNITION_TOLERANCE
) -> Optional[dict]:
    """
    Match face and return complete student information.
    
    Args:
        captured_encoding: Face encoding from captured image
        known_encodings: List of (student_id, encoding) tuples
        student_info_dict: Dictionary mapping student_id to student info
        tolerance: Face matching tolerance
        
    Returns:
        Dictionary with student_id, name, role, enrollment_id, confidence_score
    """
    match_result = match_face(captured_encoding, known_encodings, tolerance)
    
    if not match_result:
        return None
    
    student_id, confidence = match_result
    
    # Get student info
    student = student_info_dict.get(student_id)
    if not student:
        return None
    
    return {
        "student_id": student_id,
        "name": student.get("name", "Unknown"),
        "role": student.get("role", "Student"),
        "enrollment_id": student.get("enrollment_id", "N/A"),
        "confidence_score": round(confidence * 100, 2)  # Convert to percentage
    }

def draw_face_detection_box(
    image_data: bytes,
    box_coords: Tuple[int, int, int, int],
    student_info: dict
) -> bytes:
    """
    Draw bounding box and student info on image.
    
    Args:
        image_data: Original image bytes
        box_coords: (top, right, bottom, left) coordinates
        student_info: Dictionary with name, role, enrollment_id, confidence_score
        
    Returns:
        Image bytes with drawn box and text
    """
    try:
        from config import BOUNDING_BOX_COLOR, TEXT_COLOR, TEXT_BACKGROUND_COLOR, FONT_SCALE, FONT_THICKNESS
        
        # Decode image
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        top, right, bottom, left = box_coords
        
        # Draw bounding box
        cv2.rectangle(image, (left, top), (right, bottom), BOUNDING_BOX_COLOR, 2)
        
        # Prepare text
        name_text = f"Name: {student_info['name']}"
        id_text = f"ID: {student_info['enrollment_id']}"
        role_text = f"Role: {student_info['role']}"
        confidence_text = f"Match: {student_info['confidence_score']}%"
        
        # Calculate text positions (above the box)
        y_offset = top - 10
        texts = [name_text, id_text, role_text, confidence_text]
        
        for i, text in enumerate(reversed(texts)):
            # Get text size
            (text_width, text_height), baseline = cv2.getTextSize(
                text, cv2.FONT_HERSHEY_SIMPLEX, FONT_SCALE, FONT_THICKNESS
            )
            
            # Draw text background
            y_pos = y_offset - (i * (text_height + baseline + 5))
            cv2.rectangle(
                image,
                (left, y_pos - text_height - baseline),
                (left + text_width, y_pos + baseline),
                TEXT_BACKGROUND_COLOR,
                -1
            )
            
            # Draw text
            cv2.putText(
                image,
                text,
                (left, y_pos),
                cv2.FONT_HERSHEY_SIMPLEX,
                FONT_SCALE,
                TEXT_COLOR,
                FONT_THICKNESS
            )
        
        # Encode image back to bytes
        _, buffer = cv2.imencode('.jpg', image)
        return buffer.tobytes()
        
    except Exception as e:
        print(f"Error drawing face detection box: {e}")
        return image_data


def average_face_encodings(encodings: List[np.ndarray]) -> Optional[np.ndarray]:
    """
    Compute averaged face encoding from multiple encodings.
    This improves recognition accuracy by combining multiple samples.
    
    Args:
        encodings: List of face encoding arrays
        
    Returns:
        Averaged and normalized face encoding, or None if empty list
    """
    if not encodings:
        return None
    
    if len(encodings) == 1:
        return encodings[0]
    
    # Stack all encodings and compute mean
    stacked = np.vstack(encodings)
    averaged = np.mean(stacked, axis=0)
    
    # Normalize the averaged encoding
    norm = np.linalg.norm(averaged)
    if norm > 0:
        averaged = averaged / norm
    
    return averaged

def save_multiple_face_encodings(
    student_id: int,
    encodings: List[np.ndarray],
    averaged_encoding: np.ndarray
) -> dict:
    """
    Save multiple face encodings and the averaged encoding.
    
    Args:
        student_id: Student ID
        encodings: List of individual encodings
        averaged_encoding: Averaged encoding for matching
        
    Returns:
        Dictionary with paths: {'averaged': str, 'individual': List[str]}
    """
    paths = {
        'averaged': save_face_encoding(student_id, averaged_encoding),
        'individual': []
    }
    
    # Save individual encodings
    for i, encoding in enumerate(encodings):
        file_path = FACE_ENCODINGS_DIR / f"student_{student_id}_image_{i}.pkl"
        with open(file_path, 'wb') as f:
            pickle.dump(encoding, f)
        paths['individual'].append(str(file_path))
    
    return paths

def generate_multiple_face_encodings(images_data: List[bytes], num_jitters: int = 10) -> Tuple[List[np.ndarray], List[int]]:
    """
    Generate face encodings from multiple images.
    Uses higher jitter count by default for registration to ensure high quality initial encodings.
    
    Args:
        images_data: List of image bytes
        num_jitters: Jitter count for better accuracy
        
    Returns:
        Tuple of (valid_encodings, valid_indices) where valid_indices 
        indicates which images had detectable faces
    """
    encodings = []
    valid_indices = []
    
    for i, image_data in enumerate(images_data):
        # Use more jitters for registration/saving
        encoding = generate_face_encoding(image_data, num_jitters=num_jitters)
        if encoding is not None:
            encodings.append(encoding)
            valid_indices.append(i)
    
    return encodings, valid_indices

