const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const Student = require('./models/Student');
const Attendance = require('./models/Attendance');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });

const MONGO_URI = 'mongodb://127.0.0.1:27017/face_attendance_test';
const PYTHON_AI_URL = 'http://localhost:8000';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to local MongoDB (face_attendance_test)'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Dummy IDs for the test
const dummyTenantId = "TENANT_123";
const dummyClassId = new mongoose.Types.ObjectId();
const dummySubjectId = new mongoose.Types.ObjectId();
const dummyTeacherId = new mongoose.Types.ObjectId();
const dummyTimeslotId = new mongoose.Types.ObjectId();
const dummyAcademicYearId = new mongoose.Types.ObjectId();


// =========================================================================
// 1. GET STUDENTS ENDPOINT (List all students in the DB)
// =========================================================================
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({ tenantId: dummyTenantId }).select('studentId studentName faceEncoding');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =========================================================================
// 2. CREATE STUDENT ENDPOINT (Manually add a student)
// =========================================================================
app.post('/api/students', async (req, res) => {
  try {
    const { studentId, studentName } = req.body;

    const student = new Student({
      studentId,
      studentName,
      tenantId: dummyTenantId,
      phone: "+919876543210",
      email: `${studentId}@school.com`,
      dob: new Date("2010-01-01"),
      gender: "Male",
      academicYear: dummyAcademicYearId,
      faceEncoding: []
    });
    
    await student.save();
    res.json({ success: true, message: `Student ${studentName} created!`, student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// =========================================================================
// 3. REGISTER FACE ENDPOINT
// =========================================================================
app.post('/api/attendance/register-face', upload.single('image'), async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!req.file) return res.status(400).json({ error: "No image provided" });

    // Step 1: Check if this face is already registered to someone else
    const existingStudents = await Student.find({ 
      tenantId: dummyTenantId, 
      faceEncoding: { $exists: true, $not: { $size: 0 } } 
    });

    if (existingStudents.length > 0) {
      const knownEncodings = {};
      existingStudents.forEach(student => {
        // Exclude the current student if they are just re-registering their own face
        if (student.studentId !== studentId) {
          knownEncodings[student.studentId] = student.faceEncoding;
        }
      });

      if (Object.keys(knownEncodings).length > 0) {
        const checkFormData = new FormData();
        checkFormData.append('image', req.file.buffer, req.file.originalname || 'image.jpg');
        checkFormData.append('known_encodings_json', JSON.stringify(knownEncodings));

        const checkResponse = await axios.post(`${PYTHON_AI_URL}/api/face/recognize-face`, checkFormData, {
          headers: checkFormData.getHeaders()
        });

        if (checkResponse.data.matched) {
          const duplicateStudent = existingStudents.find(s => s.studentId === checkResponse.data.studentId);
          return res.status(400).json({ 
            error: `Face rejected! This face is already registered to ${duplicateStudent.studentName} (${duplicateStudent.studentId}).` 
          });
        }
      }
    }

    console.log(`Sending image to Python Service to extract encoding for: ${studentId}`);

    const formData = new FormData();
    formData.append('image', req.file.buffer, req.file.originalname || 'image.jpg');

    const aiResponse = await axios.post(`${PYTHON_AI_URL}/api/face/register-face`, formData, {
      headers: formData.getHeaders()
    });

    const embedding = aiResponse.data.encoding;

    const updatedStudent = await Student.findOneAndUpdate(
      { tenantId: dummyTenantId, studentId },
      { faceEncoding: embedding },
      { returnDocument: 'after' }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found in DB" });
    }

    res.json({ 
      success: true, 
      message: `Face registered successfully for ${updatedStudent.studentName}!` 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      error: "Error registering face", 
      details: error.response?.data || error.message 
    });
  }
});


// =========================================================================
// 4. TAKE ATTENDANCE ENDPOINT
// =========================================================================
app.post('/api/attendance/take-face-attendance', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    console.log(`Checking attendance...`);

    // Fetch all students with face encodings
    const classFaces = await Student.find({ 
      tenantId: dummyTenantId, 
      faceEncoding: { $exists: true, $not: { $size: 0 } } 
    });

    if (classFaces.length === 0) {
      return res.status(400).json({ error: "No students have registered faces yet." });
    }

    // Format encodings for Python
    const knownEncodings = {};
    classFaces.forEach(student => {
      knownEncodings[student.studentId] = student.faceEncoding;
    });

    // Send to Python
    const formData = new FormData();
    formData.append('image', req.file.buffer, req.file.originalname || 'capture.jpg');
    formData.append('known_encodings_json', JSON.stringify(knownEncodings));

    const aiResponse = await axios.post(`${PYTHON_AI_URL}/api/face/recognize-face`, formData, {
      headers: formData.getHeaders()
    });

    if (!aiResponse.data.matched) {
      return res.status(400).json({ success: false, message: "Face not recognized" });
    }

    const matchedStudentId = aiResponse.data.studentId;
    const confidence = aiResponse.data.confidence;
    
    // Find the student name to send back to the UI
    const matchedStudent = classFaces.find(s => s.studentId === matchedStudentId);
    console.log(`Python recognized: ${matchedStudent.studentName} (${matchedStudentId}) with confidence ${confidence}`);

    const attendanceRecord = new Attendance({
      tenantId: dummyTenantId,
      academicYearId: dummyAcademicYearId,
      classId: dummyClassId,
      subjectId: dummySubjectId,
      teacherId: dummyTeacherId,
      date: new Date(),
      timeslotId: dummyTimeslotId,
      records: [{
        studentRef: matchedStudent._id,
        studentId: matchedStudentId,
        status: 'P',
        description: 'Marked via Face Recognition'
      }]
    });
    await attendanceRecord.save();
    console.log(`Saved Attendance Record to DB for ${matchedStudent.studentName}`);

    res.json({ 
      success: true, 
      studentId: matchedStudentId,
      studentName: matchedStudent.studentName,
      confidence: confidence,
      message: `Successfully Recognized: ${matchedStudent.studentName} and marked Present in MongoDB!` 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      error: "Error processing attendance", 
      details: error.response?.data || error.message 
    });
  }
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test ERP Node.js server running on http://localhost:${PORT}`);
});
