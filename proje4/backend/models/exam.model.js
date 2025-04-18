const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // Duration in minutes
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ["oral", "written", "classical"],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Secretary",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Secretary",
  },
  lastEditedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Exam", ExamSchema);
