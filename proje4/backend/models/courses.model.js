const mongoose = require("mongoose");

const CourseSchema = mongoose.Schema(
  {
    courseName: { type: String, required: true },
    department: { type: String, required: true },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", CourseSchema);
module.exports = Course;
