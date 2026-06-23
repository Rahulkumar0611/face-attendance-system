const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, // e.g., STU1001
  tenantId: { type: String, required: true, index: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }, 
  isActive: { type: Boolean, default: true },
  title: {
    type: String,
    enum: ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."],
    trim: true,
    required: false,
  },
  studentName: { type: String, required: true, trim: true, minlength: 1, maxlength: 50 },
  nickName: { type: String, required: false, trim: true },
  firstName: { type: String, required: false, trim: true }, 
  middleName: { type: String, required: false, trim: true }, 
  lastName: { type: String, required: false, trim: true }, 
  enableEss: { type: Boolean },
  phone: {
    type: String,
    required: true,
    match: [/^\+91[6-9]\d{9}$/, "Invalid phone number (E.164 format required)"]
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  officialEmailId: {
    type: String,
    required: false,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  fatherName: { type: String,  trim: true, minlength: 1, maxlength: 50 },
  fatherOccupation: { type: String, required: false, trim: true },
  fatherContactNo: {
    type: String,
    required: false,
    match: [/^\+91[6-9]\d{9}$/, "Invalid Indian Phone number (E.164 format required)"]
  },
  fatheremail: {
    type: String,
    required: false,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  motherName: { type: String, trim: true, minlength: 1, maxlength: 50 },
  motherOccupation: { type: String, required: false, trim: true },
  motherContactNo: {
    type: String,
    required: false,
    match: [/^\+91[6-9]\d{9}$/, "Invalid Indian  number"]
  },
  motherEmail: {
    type: String,
    required: false,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  dob: { type: Date, required: true },
  religion: { type: mongoose.Schema.Types.ObjectId, ref: "Religion", required: false },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: false }, 
  residentialStatus: {
    type: String,
    enum: ["Residential", "Non-Residential"],
    required: false,
  },
  bloodGroup: {
    type: String,
    required: false
  },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  height: { type: String, required: false, trim: true },
  weight: { type: String, required: false, trim: true },
  physicallyChallenged: {
    type: Boolean,
    default: false,
  },
  physicalChallengeDetails: {
    type: String,
    required: function () {
      return this.physicallyChallenged === true;
    },
  },
  identificationmark: { type: String, required: false, trim: true },
  dateOfjoining: { type: Date, required: false },
  nationality: { type: String, required: false, trim: true },
  caste: { type: mongoose.Schema.Types.ObjectId, ref: "Caste", required: false },
  
  presentAddress: {
    addressLine: { type: String, required: false, minlength: 2, maxlength: 200 },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: false },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: false },
    pinCode: { type: String, required: false, maxlength: 10 },
    countryOfOrigin: { type: String, enum: ["India", "Others"], required: false },
    otherCountry: {
      type: String,
      required: function () { return this.countryOfOrigin === "Others"; },
    },
    emergencyContactName: { type: String, required: false, trim: true, minlength: 2, maxlength: 100 },
    relationship: { type: String, required: false, trim: true, minlength: 2, maxlength: 100 },
    contactno: {
      type: String,
      required: false,
      match: [/^\+91[6-9]\d{9}$/, "Invalid phone number"]
    },
    contactpersonemail: {
      type: String,
      required: false,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
  },

  permanentAddress: {
    addressLine: { type: String, required: false, minlength: 2, maxlength: 200 },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: false },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: false },
    pinCode: { type: String, required: false, maxlength: 10 },
    countryOfOrigin: { type: String, enum: ["India", "Others"], required: false },
    otherCountry: {
      type: String,
      required: function () { return this.countryOfOrigin === "Others"; },
    },
    emergencyContactName: { type: String, required: false, trim: true, minlength: 2, maxlength: 100 },
    relationship: { type: String, required: false, trim: true, minlength: 2, maxlength: 100 },
    contactno: {
      type: String,
      required: false,
      match: [/^\+91[6-9]\d{9}$/, "Invalid phone number"]
    },
    contactpersonemail: {
      type: String,
      required: false,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
  },

  officialDetails: {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: false },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: false },
    rollNumber: { type: String, required: false, trim: true },
    admissionNumber: { type: String, required: false, trim: true },
    satsno: { type: String, required: false, trim: true },
    aadhaarNumber: { type: String },
    panNumber: { type: String },
  },

  previousEducation: {
    Educationdetails: { type:String, required: false, trim: true },
    previousSchoolName: { type: String, required: false, trim: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", default: null },
    customBoard: { type: String, trim: true, default: null },
    passingYear: { type: Number, required: false, min: 1900, max: new Date().getFullYear() },
    Rollno: { type: Number, required: false, min: 0 },
    passedState: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: false },
    placeOfStudy: { type: String, required: false, trim: true },
    languageMedium: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: false }],
    grade: { type:String },
    marksObtained: { type: Number, required: false, min: 0 },
    totalmarks: { type: Number, required: false, min: 0 },
    percentage: { type: Number, required: false, min: 0, max: 100 }
  },

  guardian: {
    name: { type: String, required: false, trim: true },
    occupation: { type: String, required: false, trim: true },
    contactNumber: { type: String, required: false, trim: true }, 
    contactNumber2: { type: String, required: false, trim: true }, 
    relationShip: { type: String, required: false, minlength: 2, maxlength: 200 },
    GuardianEmailId: {
      type: String,
      required: false,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
  },

  photo: { type: String, required: false, trim: true },
  imageContentType: {
    type: String,
    enum: ["image/jpeg", "image/png"],
    required: false,
  },

  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },

  others: [
    {
      fieldId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomFieldConfig", required: false },
      value: mongoose.Schema.Types.Mixed
    }
  ],

  documents: [
    {
      documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: false },
      files: [
        {
          file: { type: String, trim: true },
          fileName: { type: String, required: false, trim: true },
          fileType: { type: String, enum: ["image", "pdf", "other"] },
          fileContentType: {
            type: String,
            enum: ["image/jpeg", "image/png", "application/pdf"]
          },
          uploadedAt: { type: Date, default: Date.now }
        }
      ]
    }
  ],

  // ✅ ADDED FOR FACE RECOGNITION
  faceEncoding: {
    type: [Number], // 128-dimensional array of floats
    required: false,
    default: []
  }

}, {
  timestamps: true,
  versionKey: false
});

mongoose.set('autoIndex', true);

module.exports = mongoose.model('Student', studentSchema);
