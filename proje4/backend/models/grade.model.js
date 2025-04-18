const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema({
  midterm: { type: Number, required: true },
  final: { type: Number, required: true },
  letterGrade: { type: String, required: true },
  makeup: { type: Boolean, default: false },
  makeupRequested: { type: Boolean, default: false },
  makeupApproved: { type: Boolean, default: false },
  makeupGrade: { type: Number },
  makeupFinal: { type: Number },
  makeupLetterGrade: { type: String },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Grade", gradeSchema);

/*const mongoose = require("mongoose");

const GradeSchema = mongoose.Schema(
  {
    midterm: { type: Number, required: true },
    final: { type: Number, required: true },
    letterGrade: {
      type: String,
      required: true,
      uppercase: true, // Harf notunu büyük harfe çevirerek tutar
      enum: ["AA", "BA", "BB", "CB", "CC", "DC", "DD", "FF"], // Olası harf notları
    },
    makeup: {
      type: Boolean,
      default: function () {
        // letterGrade FF, DD veya DC ise makeup otomatik true olur
        return ["FF", "DD", "DC"].includes(this.letterGrade);
      },
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false,
    },
  },
  { timestamps: true }
);

const Grade = mongoose.model("Grade", GradeSchema);
module.exports = Grade;*/
