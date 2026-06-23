const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section"
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true
  },
  timeslotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TimeSlot",
    required: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicYear",
    required: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  records: [
    {
      studentRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
      },
      studentId: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ["P", "A", "L", "H", "ALE"],
        default: "A"
      },
      description: String
    }
  ]
}, { timestamps: true });

attendanceSchema.index({ "records.studentRef": 1 });

attendanceSchema.index(
  {
    tenantId: 1,
    academicYearId: 1,
    classId: 1,
    sectionId: 1,
    timeslotId: 1,
    date: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false
    }
  }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
