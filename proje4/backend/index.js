const path = require("path"); // Dosya yolları için
require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const fs = require("fs");

const Student = require("./models/student.model");
const Instructor = require("./models/instructors.model");
const Course = require("./models/courses.model");
const Grade = require("./models/grade.model");
const Secretary = require("./models/secretary.model");
const MakeupRequest = require("./models/MakeupRequestSchema.model");
const Announcement = require("./models/announcement.model");
const Message = require("./models/message.model");
const upload = require("./upload");
const Notification = require("./models/notification.model");
const Exam = require("./models/exam.model");

const { authenticateToken } = require("./util");
const { authenticateToken2 } = require("./util2");
const { authenticateToken3 } = require("./util3");
const MakeupRequestSchemaModel = require("./models/MakeupRequestSchema.model");
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const blacklistedTokens = new Set();

app.get("/", (req, res) => {
  res.send("Hello from Node API!");
});

app.get("/api/student", async (req, res) => {
  try {
    const students = await Student.find({});
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving students", error });
  }
});

app.get("/api/grade", async (req, res) => {
  try {
    const grades = await Grade.find({});
    res.status(200).json(grades);
  } catch (e) {
    console.log(e);
  }
});

app.post("/api/student/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const student = await Student.findOne({ email });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { userId: student._id, role: "Student" },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({ message: "Login successful", token, student });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
    console.log(error);
  }
});

app.post("/api/student/logout", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(500).json({ message: "token required" });
    }
    if (blacklistedTokens.has(token)) {
      return res.status(403).json({ message: "Token has been invalidated." }); // Token geçersizse 403 hatası
    }
    blacklistedTokens.add(token); // Token'ı kara listeye ekle
    res.status(200).json({ message: "Logout successful" });
  } catch (e) {
    console.log(e);
  }
});

app.post("/api/student/create", authenticateToken2, async (req, res) => {
  try {
    const { name, surname, department, studentNumber, email, password } =
      req.body;

    if (await Student.findOne({ email })) {
      return res.status(400).json({ message: "Student already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const student = new Student({
      name,
      surname,
      department,
      studentNumber,
      email,
      password: hashPassword,
    });

    await student.save();
    res.status(201).json({ message: "Student registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating student", error });
  }
});

app.get(
  "/api/instructor/makeup-requests",
  authenticateToken,
  async (req, res) => {
    try {
      const instructorId = req.user.instructorId;

      // 1. Öğretmenin verdiği dersleri bul
      const courses = await Course.find({ instructor: instructorId });
      if (!courses.length) {
        return res.status(200).json([]);
      }

      // 2. Bu derslere ait bekleyen istekleri getir
      const requests = await MakeupRequest.find({
        course: { $in: courses.map((c) => c._id) },
        status: "pending",
      })
        .populate("student", "name surname studentNumber email")
        .populate("course", "courseName courseCode")
        .populate("grade", "midterm final letterGrade");

      res.status(200).json(requests);
    } catch (error) {
      console.error("Hata:", error);
      res.status(500).json({ message: "Sunucu hatası", error });
    }
  }
);

//makeupRequest Onaylananlar

app.get(
  "/api/secr/makeup-requests/approved",
  authenticateToken2,
  async (req, res) => {
    try {
      const { courseId } = req.query;
      let query = { status: "approved" };

      if (courseId) {
        query.course = courseId;
      }

      const requests = await MakeupRequest.find(query)
        .populate("student", "name surname studentNumber email")
        .populate("course", "courseName courseCode")
        .populate("grade", "midterm final letterGrade");

      // JSON'u stringify edip buffer'a çeviriyoruz
      const data = JSON.stringify(requests, null, 2);
      const buffer = Buffer.from(data, "utf-8");

      // Dosya olarak indirme
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=onaylanan_basvurular.json"
      );
      res.send(buffer);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: e.message });
    }
  }
);

app.get(
  "/api/instructor/makeup-requests/approved",
  authenticateToken,
  async (req, res) => {
    try {
      const instructorId = req.user.instructorId;

      const courses = await Course.find({ instructor: instructorId });
      if (!courses.length) {
        return res.status(200).json([]);
      }

      const requests = await MakeupRequest.find({
        course: { $in: courses.map((c) => c._id) },
        status: "approved",
      })
        .populate("student", "name surname studentNumber email")
        .populate("course", "courseName courseCode")
        .populate("grade", "midterm final letterGrade");

      res.status(200).json(requests);
    } catch (e) {
      console.log(e);
    }
  }
);

app.get(
  "/api/instructor/makeup-requests/rejected",
  authenticateToken,
  async (req, res) => {
    try {
      const instructorId = req.user.instructorId;

      const courses = await Course.find({ instructor: instructorId });
      if (!courses.length) {
        return res.status(200).json([]);
      }

      const requests = await MakeupRequest.find({
        course: { $in: courses.map((c) => c._id) },
        status: "rejected",
      })
        .populate("student", "name surname studentNumber email")
        .populate("course", "courseName courseCode")
        .populate("grade", "midterm final letterGrade");

      res.status(200).json(requests);
    } catch (e) {
      console.log(e);
    }
  }
);

app.put(
  "/api/instructor/makeup-requests/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const instructorId = req.user.instructorId;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Geçersiz işlem" });
      }

      const request = await MakeupRequest.findById(id).populate("course");
      if (!request) {
        return res.status(404).json({ message: "İstek bulunamadı" });
      }

      const course = await Course.findOne({
        _id: request.course._id,
        instructor: instructorId,
      });
      if (!course) {
        return res.status(403).json({ message: "Yetkiniz yok" });
      }

      request.status = status;
      await request.save();

      if (status === "approved") {
        await Grade.findByIdAndUpdate(request.grade, {
          makeupApproved: true,
          makeupRequested: false,
        });
      }

      res.status(200).json({
        message: `İstek ${status === "approved" ? "onaylandı" : "reddedildi"}`,
        request,
      });
    } catch (error) {
      console.error("Hata:", error);
      res.status(500).json({ message: "Sunucu hatası", error });
    }
  }
);

//insturactor
app.get("/api/instructor", async (req, res) => {
  try {
    const instructor = await Instructor.find({});
    res.status(200).json(instructor);
  } catch (e) {
    res.status(500).json({ message: "Error happened", error: e });
    console.log(e);
  }
});

app.post("/api/instructor/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const instructor = await Instructor.findOne({ email });
    if (!instructor)
      return res.status(404).json({ message: "Instructor not found" });

    const isPasswordValid = await bcrypt.compare(password, instructor.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { instructorId: instructor._id, role: "Instructor" },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "72h" }
    );

    res.status(200).json({ message: "Login successful", token, instructor });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

app.post("/api/makeup/approve", authenticateToken3, async (req, res) => {
  try {
    const { requestId, courseId, autoApproved } = req.body;
    const { studentId } = req.user;

    // Find and update the makeup request
    const makeupRequest = await MakeupRequest.findById(requestId);
    if (!makeupRequest) {
      return res.status(404).json({ message: "Makeup request not found" });
    }

    // Verify the request belongs to the student
    if (makeupRequest.student.toString() !== studentId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update the makeup request status
    makeupRequest.status = "approved";
    await makeupRequest.save();

    // Update the grade's makeup status
    await Grade.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        makeupApproved: true,
        makeupRequested: false,
      }
    );

    // Send response
    res.status(200).json({
      message: "Makeup request approved successfully",
      request: makeupRequest,
    });
  } catch (error) {
    console.error("Error approving makeup request:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.post("/api/makeup/request", authenticateToken3, async (req, res) => {
  try {
    const { courseId, text, status, autoApproved } = req.body;
    const { studentId } = req.user;

    const [course, grade] = await Promise.all([
      Course.findById(courseId),
      Grade.findOne({
        student: studentId,
        course: courseId,
      }).populate("course student"),
    ]);

    if (!course) return res.status(404).json({ message: "Ders bulunamadı" });
    if (!grade)
      return res.status(404).json({ message: "Not bilgisi bulunamadı" });

    const eligibleGrades = ["FF", "DD", "DC"];
    if (!eligibleGrades.includes(grade.letterGrade)) {
      return res.status(400).json({
        message: "Bütünleme isteği için uygun notunuz yok",
        yourGrade: grade.letterGrade,
        eligibleGrades,
      });
    }

    const existingRequest = await MakeupRequest.findOne({
      student: studentId,
      course: courseId,
    });

    const response = {
      user: req.user,
      course: {
        _id: course._id,
        name: course.courseName,
        code: course.courseCode,
      },
      grade: {
        _id: grade._id,
        midterm: grade.midterm,
        final: grade.final,
        letterGrade: grade.letterGrade,
        makeupStatus: {
          requested: !!existingRequest,
          approved: existingRequest?.status === "approved",
        },
      },
    };

    if (existingRequest) {
      return res.status(200).json({
        ...response,
        message: "Bu ders için zaten büt isteğiniz bulunuyor",
        existingRequest: {
          id: existingRequest._id,
          status: existingRequest.status,
          createdAt: existingRequest.createdAt,
        },
      });
    }

    // Create new request with auto-approval if specified
    const newRequest = new MakeupRequest({
      student: studentId,
      course: courseId,
      grade: grade._id,
      text: text,
      status: autoApproved ? "approved" : "pending",
    });

    await newRequest.save();

    // Update grade status
    grade.makeupRequested = true;
    if (autoApproved) {
      grade.makeupApproved = true;
      grade.makeupRequested = false;
    }
    await grade.save();

    res.status(201).json({
      ...response,
      grade: {
        ...response.grade,
        makeupStatus: {
          requested: true,
          approved: autoApproved || false,
        },
      },
      message: autoApproved
        ? "Büt isteği otomatik olarak onaylandı"
        : "Büt isteği başarıyla gönderildi",
      request: {
        id: newRequest._id,
        status: newRequest.status,
        createdAt: newRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Makeup request error:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.get("/api/student/makeup/req", authenticateToken3, async (req, res) => {
  try {
    const { studentId } = req.user;

    const makeUpRequests = await MakeupRequest.find({ student: studentId })
      .populate("course", "courseName courseCode")
      .populate("grade", "midterm final letterGrade")
      .sort({ createdAt: -1 });

    if (!makeUpRequests || makeUpRequests.length === 0) {
      return res.status(200).json([]);
    }

    const response = makeUpRequests.map((request) => ({
      _id: request._id,
      course: request.course,
      grade: request.grade,
      status: request.status,
      text: request.text,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));

    res.status(200).json(response);
  } catch (e) {
    console.error("Makeup requests error:", e);
    res.status(500).json({
      message: "Bütünleme istekleri alınırken hata oluştu",
      error: process.env.NODE_ENV === "development" ? e.message : undefined,
    });
  }
});
app.get("/api/makeup/check", authenticateToken3, async (req, res) => {
  try {
    const { courseId } = req.query;
    const { studentId } = req.user;

    const [course, grade] = await Promise.all([
      Course.findById(courseId),
      Grade.findOne({
        student: studentId,
        course: courseId,
      }).populate("course student"),
    ]);

    if (!course || !grade) {
      return res
        .status(404)
        .json({ message: "Ders veya not bilgisi bulunamadı" });
    }

    const existingRequest = await MakeupRequest.findOne({
      student: studentId,
      course: courseId,
    });

    res.status(200).json({
      course: {
        _id: course._id,
        name: course.courseName,
        code: course.courseCode,
      },
      grade: {
        letterGrade: grade.letterGrade,
        makeupStatus: {
          requested: !!existingRequest,
          approved: existingRequest?.status === "approved",
        },
      },
      existingRequest: existingRequest
        ? {
            id: existingRequest._id,
            status: existingRequest.status,
            createdAt: existingRequest.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Makeup check error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/instructor/create", async (req, res) => {
  try {
    const { name, surname, department, email, password } = req.body;

    if (await Instructor.findOne({ email })) {
      return res.status(400).json({ message: "Instructor already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const instructor = new Instructor({
      name,
      surname,
      department,
      email,
      password: hashPassword,
    });

    await instructor.save();
    res.status(201).json({ message: "Instructor registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating instructor", error });
  }
});

app.post("/api/course/create", authenticateToken, async (req, res) => {
  try {
    const { courseName, department } = req.body;

    if (!courseName || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const course = new Course({
      courseName,
      department,
      instructor: req.user.instructorId,
    });
    await course.save();

    res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Error creating course", error });
    console.log(error);
  }
});

function checkMakeupEligibility(student, course, currentGrade) {
  if (student.previousMakeups?.includes(course._id)) {
    return false;
  }

  if (student.attendanceRate < course.minAttendanceForMakeup) {
    return false;
  }

  const eligibleGrades = ["FF", "DC", "DD"];
  if (!eligibleGrades.includes(currentGrade.letterGrade)) {
    return false;
  }

  if (new Date() > course.makeupApplicationDeadline) {
    return false;
  }

  return true;
}

app.put("/api/grade/update/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { midterm, final, büt } = req.body;

    const grade = await Grade.findById(id)
      .populate("course instructor")
      .populate("student");

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: "Not bulunamadı",
      });
    }

    if (grade.instructor._id.toString() !== req.user.instructorId) {
      return res.status(403).json({
        success: false,
        message: "Bu notu güncelleme yetkiniz yok",
      });
    }

    if (büt !== undefined) {
      const canTakeMakeup = checkMakeupEligibility(
        grade.student,
        grade.course,
        grade
      );

      if (!canTakeMakeup) {
        return res.status(400).json({
          success: false,
          message: "Bu öğrenci büt notu alamaz",
        });
      }
    }

    const finalGrade = büt !== undefined ? büt : final;
    const oldLetterGrade = grade.letterGrade;

    const calculateLetterGrade = (midterm, final) => {
      const avg = (midterm + final) / 2;
      if (avg < 50) return "FF";
      if (avg < 60) return "DC";
      if (avg < 70) return "CC";
      if (avg < 76) return "CB";
      if (avg < 80) return "BB";
      if (avg < 86) return "BA";
      return "AA";
    };

    const letterGrade = calculateLetterGrade(midterm, finalGrade);
    const requiresMakeup = ["FF", "DC", "DD"].includes(letterGrade);

    grade.midterm = midterm;
    grade.final = finalGrade;
    grade.letterGrade = letterGrade;
    grade.makeup = requiresMakeup;

    if (büt !== undefined) {
      grade.makeupApproved = true;
    }

    if (requiresMakeup) {
      grade.makeupRequested = false;
      if (!grade.makeupApproved) {
        grade.makeupApproved = false;
      }
    }

    await grade.save();

    // Create notification for the student about grade update
    let notificationMessage = `Your grade for ${grade.course.courseName} has been updated. `;
    if (büt !== undefined) {
      notificationMessage += `Makeup Exam: ${büt}, New Letter Grade: ${letterGrade}`;
    } else {
      notificationMessage += `Midterm: ${midterm}, Final: ${finalGrade}, New Letter Grade: ${letterGrade}`;
    }

    const notification = new Notification({
      recipientId: grade.student._id,
      recipientType: "student",
      title: "Grade Updated",
      message: notificationMessage,
      type: "grade_update",
      relatedId: grade._id,
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Not başarıyla güncellendi",
      grade: grade,
    });
  } catch (error) {
    console.error("Not güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message,
    });
  }
});

app.delete("/api/grade/delete/:id", authenticateToken, async (req, res) => {
  try {
    console.log("\n=== DELETE GRADE REQUEST ===");
    console.log("Headers:", req.headers);
    console.log("User:", req.user); // Should show authenticated user
    console.log("Grade ID:", req.params.id);

    const grade = await Grade.findById(req.params.id).populate({
      path: "course",
      populate: {
        path: "instructor",
        select: "_id name email",
      },
    });

    if (!grade) {
      console.log("Grade not found in database");
      return res
        .status(404)
        .json({ success: false, message: "Grade not found" });
    }

    console.log("Course Instructor:", grade.course.instructor);
    console.log("Requesting User:", req.user.id);

    if (grade.course.instructor._id.toString() !== req.user.id) {
      console.log("AUTHORIZATION FAILED: Instructor doesn't own this course");
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized - You can only delete grades for your own courses",
      });
    }

    console.log("Authorization passed - proceeding with deletion");
    await Grade.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Grade deleted successfully",
      deletedGradeId: req.params.id,
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error during grade deletion",
    });
  }
});
app.post("/api/grade/create", authenticateToken, async (req, res) => {
  try {
    const { studentNumber, midterm, final, courseId } = req.body;

    // Öğrenciyi kontrol et
    const student = await Student.findOne({ studentNumber });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Öğrenci bulunamadı",
      });
    }

    // Dersi kontrol et
    const course = await Course.findById(courseId).populate("instructor");
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Ders bulunamadı",
      });
    }

    // Eğitmen yetkisi kontrolü
    if (course.instructor._id.toString() !== req.user.instructorId) {
      return res.status(403).json({
        success: false,
        message: "Bu ders için not ekleme yetkiniz yok",
      });
    }

    // Var olan not kontrolü
    const existingGrade = await Grade.findOne({
      student: student._id,
      course: courseId,
    });
    if (existingGrade) {
      return res.status(400).json({
        success: false,
        message: "Bu öğrencinin ders için zaten notu var",
        existingGrade,
      });
    }

    // Harf notu hesaplama fonksiyonu
    const calculateLetterGrade = (midterm, final) => {
      const avg = (midterm + final) / 2;
      if (avg < 50) return "FF";
      if (avg < 60) return "DC";
      if (avg < 70) return "CC";
      if (avg < 76) return "CB";
      if (avg < 80) return "BB";
      if (avg < 86) return "BA";
      return "AA";
    };

    const letterGrade = calculateLetterGrade(midterm, final);
    const requiresMakeup = ["FF", "DD", "DC"].includes(letterGrade);

    // Yeni not oluştur
    const newGrade = new Grade({
      midterm,
      final,
      letterGrade,
      makeup: requiresMakeup,
      makeupRequested: false,
      makeupApproved: false,
      course: courseId,
      student: student._id,
      instructor: course.instructor._id,
    });

    await newGrade.save();

    // Create notification for the student
    const notification = new Notification({
      recipientId: student._id,
      recipientType: "student",
      title: "New Grade Added",
      message: `Your grade for ${course.courseName} has been added. Midterm: ${midterm}, Final: ${final}, Letter Grade: ${letterGrade}`,
      type: "grade_update",
      relatedId: newGrade._id,
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Not başarıyla eklendi",
      grade: {
        ...newGrade.toObject(),
        studentInfo: {
          name: student.name,
          surname: student.surname,
          studentNumber: student.studentNumber,
        },
        courseInfo: {
          name: course.courseName,
          code: course.courseCode,
        },
        instructorInfo: {
          name: course.instructor.name,
          surname: course.instructor.surname,
        },
      },
    });
  } catch (error) {
    console.error("Not ekleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message,
    });
  }
});

app.get("/api/get/secretary/info", authenticateToken2, async (req, res) => {
  try {
    const secretaryId = req.user.secretaryId;

    const secretar = await Secretary.findById(secretaryId)
      .select("name surname email ")
      .lean();

    if (!secretar) {
      return res.status(200).json({ message: "secreter bulunamadı" });
    }

    const secretaryInfo = {
      name: secretar.name,
      surname: secretar.surname,
      email: secretar.email,
    };
    return res.status(200).json(secretaryInfo);
  } catch (e) {
    console.log(e);
  }
});

app.get("/api/get/student/info", authenticateToken3, async (req, res) => {
  try {
    const studentId = req.user.studentId;

    // Öğrenci bilgilerini al
    const student = await Student.findById(studentId)
      .select("name surname studentNumber email department") // Daha fazla alan ekleyebilirsiniz
      .lean(); // Mongoose dokümanını plain JavaScript objesine çevirir

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Öğrenci bulunamadı",
      });
    }

    // Güvenlik için gereksiz bilgileri filtreleme
    const studentInfo = {
      name: student.name,
      surname: student.surname,
      fullName: `${student.name} ${student.surname}`,
      studentNumber: student.studentNumber,
      department: student.department,
      email: student.email,
      _id: student._id,
    };

    return res.status(200).json({
      success: true,
      data: studentInfo,
    });
  } catch (error) {
    console.error("Öğrenci bilgisi alınırken hata:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message,
    });
  }
});

app.get("/api/ins/getMy/students", authenticateToken, async (req, res) => {
  try {
    const instructorId = req.user.instructorId;
    const { courseId } = req.query;

    // Grade modelinde instructor ve course referansları olmalı
    const query = { instructor: instructorId };
    if (courseId) query.course = courseId;

    const grades = await Grade.find(query)
      .populate("student", "name surname studentNumber")
      .populate("course", "courseName courseCode");

    res.status(200).json(grades);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/get/ins/getMy", authenticateToken, async (req, res) => {
  try {
    const instructorId = req.user.instructorId;
    //res.status(200).json(instructorId);

    const instructor = await Instructor.findById(instructorId);
    res.status(200).json(instructor);
  } catch (e) {
    console.log(e);
  }
});

app.get("/api/getMy/course", authenticateToken, async (req, res) => {
  try {
    const instructorId = req.user.instructorId;
    const myCourses = await Course.find({ instructor: instructorId })
      .populate("instructor", "name surname email department")
      .exec();
    res.status(200).json(myCourses);
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

app.get("/api/course/getMy", authenticateToken3, async (req, res) => {
  try {
    const studentId = req.user.studentId;

    // Öğrenci bilgilerini al
    const student = await Student.findById(studentId).select(
      "name surname studentNumber"
    );

    if (!student) {
      return res.status(404).json({ message: "Öğrenci bulunamadı!" });
    }

    const grades = await Grade.find({ student: studentId }).populate({
      path: "course",
      populate: {
        path: "instructor",
        select: "name surname", // Only select name and surname fields
      },
    });

    return res.status(200).json({
      studentInfo: {
        name: student.name,
        surname: student.surname,
        studentNumber: student.studentNumber,
      },
      courses: grades.map((grade) => ({
        course: {
          ...grade.course.toObject(),
          instructor: grade.course.instructor
            ? `${grade.course.instructor.name} ${grade.course.instructor.surname}`
            : "Unknown Instructor",
        },
        letterGrade: grade.letterGrade,
      })),
    });
  } catch (error) {
    console.error("Hata:", error);
    return res.status(500).json({
      message: "Bir hata oluştu!",
      error: error.message,
    });
  }
});

app.get("/api/course", async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving courses", error });
  }
});
app.get("/api/announcement", async (req, res) => {
  try {
    const Announcements = await Announcement.find({});
    res.status(200).json(Announcements);
  } catch (e) {
    console.log(e);
  }
});

app.post("/api/secretary/create", async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;

    if (await Secretary.findOne({ email })) {
      return res.status(500).json({ message: "secreatery already exist" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const secretary = new Secretary({
      name,
      surname,
      email,
      password: hashPassword,
    });
    await secretary.save();
    res.status(200).json({ message: "secreatery saved" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e });
  }
});
app.post("/api/secretary/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(500).json({
        message: "email and password required",
      });
    }

    const secretary = await Secretary.findOne({ email });

    if (!secretary) {
      return res.status(500).json({ message: "secretary not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, secretary.password);
    if (!isPasswordValid) {
      return res.status(500).json({ message: "password is incorect" });
    }

    const token = jwt.sign(
      { secretaryId: secretary._id, role: "Secretary" },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "72h" }
    );
    res.status(200).json({ message: "Login successful", token, secretary });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});
app.get("/api/secretary", async (req, res) => {
  try {
    const secreateries = await Secretary.find({});
    res.status(200).json(secreateries);
  } catch (e) {
    console.log(e);
  }
});

app.post(
  "/api/announcement/add",
  authenticateToken2,
  upload.array("files"),
  async (req, res) => {
    try {
      console.log("Creating announcement with data:", {
        title: req.body.title,
        content: req.body.content,
        department: req.body.department,
        type: req.body.type,
        secretaryId: req.user.secretaryId,
        instructorId: req.user.instructorId,
      });

      const { title, content, department, type } = req.body;
      const secretaryId = req.user.secretaryId;
      const instructorId = req.user.instructorId;

      if (!title || !content || !department || !type) {
        console.log("Missing required fields:", {
          title,
          content,
          department,
          type,
        });
        return res.status(400).json({
          message: "Title, content, department, and type are required",
          receivedData: { title, content, department, type },
        });
      }

      // Create the announcement
      const announcement = new Announcement({
        title,
        content,
        department,
        type,
        files:
          req.files?.map((file) => ({
            filename: file.filename,
            path: file.path,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          })) || [],
        secretary: secretaryId,
        instructor: instructorId,
      });

      await announcement.save();
      console.log("Announcement saved with ID:", announcement._id);

      // Get all students and instructors in the department
      const [students, instructors] = await Promise.all([
        Student.find({ department }),
        Instructor.find({ department }),
      ]);

      console.log(`Found recipients in ${department}:`, {
        studentCount: students.length,
        instructorCount: instructors.length,
        students: students.map((s) => ({ id: s._id, email: s.email })),
        instructors: instructors.map((i) => ({ id: i._id, email: i.email })),
      });

      // Create notifications for students and instructors
      const notifications = [
        ...students.map((student) => ({
          recipientId: student._id,
          recipientType: "student",
          title: "New Announcement",
          message: `New ${type} announcement: ${title}`,
          type: "announcement",
          relatedId: announcement._id,
        })),
        ...instructors.map((instructor) => ({
          recipientId: instructor._id,
          recipientType: "instructor",
          title: "New Announcement",
          message: `New ${type} announcement: ${title}`,
          type: "announcement",
          relatedId: announcement._id,
        })),
      ];

      console.log(
        `Creating ${notifications.length} notifications:`,
        notifications
      );

      // Save all notifications
      if (notifications.length > 0) {
        const savedNotifications = await Notification.insertMany(notifications);
        console.log(
          `Successfully created ${savedNotifications.length} notifications:`,
          savedNotifications.map((n) => ({
            id: n._id,
            recipientId: n.recipientId,
            recipientType: n.recipientType,
          }))
        );
      }

      res.status(201).json({
        message: "Announcement created successfully",
        announcement,
        notificationCount: notifications.length,
        department: department,
        recipientCounts: {
          students: students.length,
          instructors: instructors.length,
        },
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({
        message: "Error creating announcement",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

app.get("/api/files/:filename", authenticateToken2, (req, res) => {
  try {
    const cleanFilename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "");

    const absolutePath = path.resolve(__dirname, "uploads", cleanFilename);

    const uploadsDir = path.resolve(__dirname, "uploads");
    if (!absolutePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: "Yetkisiz erişim" });
    }

    // Dosya var mı kontrol et
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "Dosya bulunamadı" });
    }

    // Orijinal dosya adını al
    const originalname = req.query.originalname || cleanFilename;

    // Dosyayı indir
    res.download(absolutePath, originalname);
  } catch (error) {
    console.error("Dosya indirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Öğrenciler için dosya indirme endpoint'i
app.get("/api/student/files/:filename", authenticateToken3, (req, res) => {
  try {
    const cleanFilename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "");

    const absolutePath = path.resolve(__dirname, "uploads", cleanFilename);

    const uploadsDir = path.resolve(__dirname, "uploads");
    if (!absolutePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: "Yetkisiz erişim" });
    }

    // Dosya var mı kontrol et
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "Dosya bulunamadı" });
    }

    // Orijinal dosya adını al
    const originalname = req.query.originalname || cleanFilename;

    console.log(`Öğrenci dosya indiriyor: ${originalname} (${cleanFilename})`);

    // Dosyayı indir
    res.download(absolutePath, originalname);
  } catch (error) {
    console.error("Öğrenci dosya indirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/api/messages", upload.single("file"), async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    console.log("Gelen veri:", req.body);

    // Validasyon

    if (!senderId) {
      return res.status(400).json({ error: "Gönderici ID'si gereklidir" });
    }

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ error: "Geçersiz gönderici ID formatı" });
    }
    const requiredFields = ["senderId", "receiverId", "content"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} alanı gereklidir` });
      }
    }

    const newMessage = new Message({
      sender: senderId,
      senderModel: "Student",
      receiver: receiverId,
      receiverModel: "Instructor",
      message: content,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Mesaj kaydetme hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/messages/:senderId/:receiverId", async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Mesaj getirme hatası:", error);
    res.status(500).json({ error: "Mesajlar yüklenemedi" });
  }
});

// Get notifications for instructor
app.get(
  "/api/instructor/notifications",
  authenticateToken,
  async (req, res) => {
    try {
      const instructorId = req.user.instructorId;
      console.log("Fetching notifications for instructor:", instructorId);

      // First, verify the instructor exists
      const instructor = await Instructor.findById(instructorId);
      if (!instructor) {
        console.log("Instructor not found:", instructorId);
        return res.status(404).json({ message: "Instructor not found" });
      }
      console.log("Found instructor:", {
        id: instructor._id,
        email: instructor.email,
        department: instructor.department,
      });

      const notifications = await Notification.find({
        recipientId: instructorId,
        recipientType: "instructor",
      })
        .sort({ createdAt: -1 })
        .limit(50);

      console.log(
        `Found ${notifications.length} notifications for instructor:`,
        notifications.map((n) => ({
          id: n._id,
          title: n.title,
          isRead: n.isRead,
          createdAt: n.createdAt,
        }))
      );

      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching instructor notifications:", error);
      res.status(500).json({
        message: "Error fetching notifications",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Mark instructor notification as read
app.put(
  "/api/instructor/notifications/:id/read",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const instructorId = req.user.instructorId;
      console.log(
        "Marking notification as read:",
        id,
        "for instructor:",
        instructorId
      );

      const notification = await Notification.findOneAndUpdate(
        {
          _id: id,
          recipientId: instructorId,
          recipientType: "instructor",
        },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        console.log("Notification not found or not authorized");
        return res
          .status(404)
          .json({ message: "Notification not found or not authorized" });
      }

      console.log("Successfully marked notification as read");
      res.status(200).json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        message: "Error marking notification as read",
        error: error.message,
      });
    }
  }
);

// Get notifications for student
app.get("/api/student/notifications", authenticateToken3, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    console.log("Fetching notifications for student:", studentId);

    // First, verify the student exists
    const student = await Student.findById(studentId);
    if (!student) {
      console.log("Student not found:", studentId);
      return res.status(404).json({ message: "Student not found" });
    }
    console.log("Found student:", {
      id: student._id,
      email: student.email,
      department: student.department,
    });

    const notifications = await Notification.find({
      recipientId: studentId,
      recipientType: "student",
    })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(
      `Found ${notifications.length} notifications for student:`,
      notifications.map((n) => ({
        id: n._id,
        title: n.title,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }))
    );

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching student notifications:", error);
    res.status(500).json({
      message: "Error fetching notifications",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Mark student notification as read
app.put(
  "/api/student/notifications/:id/read",
  authenticateToken3,
  async (req, res) => {
    try {
      const { id } = req.params;
      const studentId = req.user.studentId;
      console.log(
        "Marking notification as read:",
        id,
        "for student:",
        studentId
      );

      const notification = await Notification.findOneAndUpdate(
        {
          _id: id,
          recipientId: studentId,
          recipientType: "student",
        },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        console.log("Notification not found or not authorized");
        return res
          .status(404)
          .json({ message: "Notification not found or not authorized" });
      }

      console.log("Successfully marked notification as read");
      res.status(200).json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        message: "Error marking notification as read",
        error: error.message,
      });
    }
  }
);

app.post("/api/exam/create", authenticateToken2, async (req, res) => {
  try {
    console.log("Received exam creation request:", req.body);
    console.log("User info:", req.user);

    const { title, courseId, date, duration, location, description, type } =
      req.body;

    // Validate required fields
    if (!title || !courseId || !date || !duration || !location || !type) {
      console.log("Missing required fields:", {
        title,
        courseId,
        date,
        duration,
        location,
        type,
      });
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    // Verify the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }
    console.log("Found course:", course);

    // Create the exam
    const exam = new Exam({
      title,
      course: courseId,
      date,
      duration,
      location,
      description,
      type,
      createdBy: req.user.secretaryId || req.user.instructorId,
      editedBy: req.user.secretaryId || req.user.instructorId,
      lastEditedAt: new Date(),
    });

    console.log("Created exam object:", exam);

    // Save the exam
    const savedExam = await exam.save();
    console.log("Saved exam:", savedExam);

    // Create notifications
    const students = await Student.find({ courses: courseId });
    console.log(`Found ${students.length} students for notifications`);

    // Create notification for instructor
    const instructorNotification = new Notification({
      recipientId: course.instructor,
      recipientType: "instructor",
      title: "New Exam Created",
      message: `A new exam "${title}" has been created for ${
        course.courseName
      } by ${req.user.name || "a secretary"}`,
      type: "exam",
      relatedId: savedExam._id,
    });
    await instructorNotification.save();
    console.log("Created instructor notification");

    // Create notifications for students
    if (students.length > 0) {
      const studentNotifications = students.map((student) => ({
        recipientId: student._id,
        recipientType: "student",
        title: "New Exam Created",
        message: `A new exam "${title}" has been created for ${course.courseName}`,
        type: "exam",
        relatedId: savedExam._id,
      }));
      await Notification.insertMany(studentNotifications);
      console.log(
        `Created ${studentNotifications.length} student notifications`
      );
    }

    res.status(201).json({
      message: "Exam created successfully",
      exam: savedExam,
      notificationsCreated: {
        instructor: true,
        students: students.length,
      },
    });
  } catch (error) {
    console.error("Error creating exam:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error creating exam",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Add endpoint to get exams for a course
app.get("/api/exam/course/:courseId", authenticateToken, async (req, res) => {
  try {
    const exams = await Exam.find({ course: req.params.courseId })
      .populate("course", "courseName courseCode")
      .populate("createdBy", "name")
      .populate("editedBy", "name")
      .sort({ date: 1 });

    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    res
      .status(500)
      .json({ message: "Error fetching exams", error: error.message });
  }
});

// Add endpoint to get all exams for a student
app.get("/api/exam/student", authenticateToken3, async (req, res) => {
  try {
    const studentId = req.user.studentId;

    // First get all courses where this student has grades
    const grades = await Grade.find({ student: studentId });
    const courseIds = grades.map((grade) => grade.course);

    // Then get all exams for these courses
    const exams = await Exam.find({
      course: { $in: courseIds },
    })
      .populate("course", "courseName courseCode")
      .populate("createdBy", "name")
      .populate("editedBy", "name")
      .sort({ date: 1 });

    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching student exams:", error);
    res.status(500).json({
      message: "Error fetching student exams",
      error: error.message,
    });
  }
});

// Add endpoint to get all exams for an instructor
app.get("/api/exam/instructor", authenticateToken, async (req, res) => {
  try {
    const instructorId = req.user.instructorId;

    // First get all courses where this instructor is assigned
    const courses = await Course.find({ instructor: instructorId });

    // Then get all exams for these courses
    const exams = await Exam.find({
      course: { $in: courses.map((c) => c._id) },
    })
      .populate("course", "courseName courseCode")
      .populate("createdBy", "name")
      .populate("editedBy", "name")
      .sort({ date: 1 });

    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching instructor exams:", error);
    res.status(500).json({
      message: "Error fetching instructor exams",
      error: error.message,
    });
  }
});

// Delete instructor notification
app.delete(
  "/api/instructor/notifications/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const instructorId = req.user.instructorId;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        recipientId: instructorId,
        recipientType: "instructor",
      });

      if (!notification) {
        return res
          .status(404)
          .json({ message: "Notification not found or not authorized" });
      }

      res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        message: "Error deleting notification",
        error: error.message,
      });
    }
  }
);

// Delete student notification
app.delete(
  "/api/student/notifications/:id",
  authenticateToken3,
  async (req, res) => {
    try {
      const { id } = req.params;
      const studentId = req.user.studentId;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        recipientId: studentId,
        recipientType: "student",
      });

      if (!notification) {
        return res
          .status(404)
          .json({ message: "Notification not found or not authorized" });
      }

      res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        message: "Error deleting notification",
        error: error.message,
      });
    }
  }
);

app.put("/api/exam/update/:id", authenticateToken2, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title: newTitle,
      date: newDate,
      duration: newDuration,
      location: newLocation,
      description: newDescription,
      type: newType,
    } = req.body;

    // Find the exam
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Update exam fields
    exam.title = newTitle;
    exam.date = newDate;
    exam.duration = newDuration;
    exam.location = newLocation;
    exam.description = newDescription;
    exam.type = newType;
    exam.editedBy = req.user.secretaryId || req.user.instructorId;
    exam.lastEditedAt = new Date();

    // Save the updated exam
    const updatedExam = await exam.save();

    // Create notification for instructor
    const course = await Course.findById(exam.course);
    if (course) {
      const notification = new Notification({
        recipientId: course.instructor,
        recipientType: "instructor",
        title: "Exam Updated",
        message: `The exam "${newTitle}" has been updated by ${
          req.user.name || "a secretary"
        }`,
        type: "exam",
        relatedId: exam._id,
      });
      await notification.save();
    }

    res.status(200).json({
      message: "Exam updated successfully",
      exam: updatedExam,
    });
  } catch (error) {
    console.error("Error updating exam:", error);
    res.status(500).json({
      message: "Error updating exam",
      error: error.message,
    });
  }
});

app.get("/api/instructor/:id", async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
      .select("name surname email department")
      .lean();

    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    res.status(200).json(instructor);
  } catch (error) {
    console.error("Error fetching instructor:", error);
    res.status(500).json({
      message: "Error fetching instructor details",
      error: error.message,
    });
  }
});

// Get instructors by department
app.get(
  "/api/department/instructors/:department",
  authenticateToken3,
  async (req, res) => {
    try {
      const { department } = req.params;
      const instructors = await Instructor.find({ department })
        .select("name surname email expertise department")
        .lean();

      res.status(200).json(instructors);
    } catch (error) {
      console.error("Error fetching department instructors:", error);
      res.status(500).json({
        message: "Error fetching department instructors",
        error: error.message,
      });
    }
  }
);

// Get available courses for students
app.get("/api/course/available", authenticateToken3, async (req, res) => {
  try {
    const student = await Student.findById(req.user.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get all courses from the student's department
    const courses = await Course.find({ department: student.department })
      .populate("instructor", "name surname email expertise")
      .lean();

    // Get courses student is already enrolled in
    const enrolledCourses = await Grade.find({ student: student._id })
      .select("course")
      .lean();

    const enrolledCourseIds = enrolledCourses.map((grade) =>
      grade.course.toString()
    );

    // Filter out courses student is already enrolled in
    const availableCourses = courses.filter(
      (course) => !enrolledCourseIds.includes(course._id.toString())
    );

    // Add additional course information
    const enhancedCourses = availableCourses.map((course) => ({
      ...course,
      instructorName: course.instructor
        ? `${course.instructor.name} ${course.instructor.surname}`
        : "Unknown",
      instructorEmail: course.instructor?.email || "N/A",
      instructorExpertise: course.instructor?.expertise || "N/A",
    }));

    res.status(200).json(enhancedCourses);
  } catch (error) {
    console.error("Error fetching available courses:", error);
    res.status(500).json({
      message: "Error fetching available courses",
      error: error.message,
    });
  }
});

// Register student for courses
app.post(
  "/api/student/register-courses",
  authenticateToken3,
  async (req, res) => {
    try {
      const coursesToRegister = Array.isArray(req.body)
        ? req.body
        : req.body.courses;
      const studentId = req.user.studentId;

      console.log("Registration request:", {
        studentId,
        coursesToRegister,
        body: req.body,
      });

      if (!Array.isArray(coursesToRegister) || coursesToRegister.length === 0) {
        return res.status(400).json({
          message: "Please select at least one course",
          received: coursesToRegister,
        });
      }

      if (coursesToRegister.length > 5) {
        return res.status(400).json({
          message: "You can only select up to 5 courses",
          selected: coursesToRegister.length,
        });
      }

      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          message: "Student not found",
          studentId,
        });
      }

      console.log("Found student:", {
        id: student._id,
        name: student.name,
        department: student.department,
      });

      // Verify all courses exist and are from student's department
      const courseDocs = await Course.find({
        _id: { $in: coursesToRegister },
      }).populate("instructor");

      if (!courseDocs || courseDocs.length === 0) {
        return res.status(404).json({
          message: "No valid courses found",
          requestedCourses: coursesToRegister,
        });
      }

      console.log(
        "Found courses:",
        courseDocs.map((c) => ({
          id: c._id,
          name: c.courseName,
          department: c.department,
          instructor: c.instructor
            ? `${c.instructor.name} ${c.instructor.surname}`
            : "No instructor",
        }))
      );

      if (courseDocs.length !== coursesToRegister.length) {
        return res.status(400).json({
          message: "One or more selected courses are invalid",
          requested: coursesToRegister.length,
          found: courseDocs.length,
          validCourses: courseDocs.map((c) => c._id),
        });
      }

      // Check if student is already enrolled in any of the selected courses
      const existingGrades = await Grade.find({
        student: studentId,
        course: { $in: coursesToRegister },
      });

      if (existingGrades.length > 0) {
        return res.status(400).json({
          message:
            "You are already enrolled in one or more of the selected courses",
          existingCourses: existingGrades.map((g) => ({
            courseId: g.course,
            grade: g.letterGrade,
          })),
        });
      }

      // Create grade entries for each course
      const gradeEntries = courseDocs.map((course) => ({
        student: studentId,
        course: course._id,
        instructor: course.instructor?._id,
        midterm: 0,
        final: 0,
        letterGrade: "NA",
        makeup: false,
        makeupRequested: false,
        makeupApproved: false,
      }));

      console.log("Creating grade entries:", gradeEntries);

      try {
        const createdGrades = await Grade.insertMany(gradeEntries);
        console.log("Successfully created grades:", createdGrades.length);

        // Create notifications for instructors
        const notifications = courseDocs
          .filter((course) => course.instructor)
          .map((course) => ({
            recipientId: course.instructor._id,
            recipientType: "instructor",
            title: "New Student Enrollment",
            message: `${student.name} ${student.surname} has enrolled in your course ${course.courseName}`,
            type: "enrollment",
            relatedId: course._id,
          }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }

        res.status(200).json({
          message: "Successfully registered for courses",
          registeredCourses: courseDocs.map((c) => ({
            id: c._id,
            name: c.courseName,
            instructor: c.instructor
              ? `${c.instructor.name} ${c.instructor.surname}`
              : "No instructor",
          })),
        });
      } catch (dbError) {
        console.error("Database error during grade creation:", dbError);
        return res.status(500).json({
          message: "Error creating grade entries",
          error: dbError.message,
        });
      }
    } catch (error) {
      console.error("Error in course registration:", error);
      res.status(500).json({
        message: "Error registering for courses",
        error: error.message,
        type: error.name,
      });
    }
  }
);

// Add endpoint to get student count for a course
app.get("/api/course/:courseId/students/count", async (req, res) => {
  try {
    const { courseId } = req.params;

    // Count the number of grades (enrollments) for this course
    const count = await Grade.countDocuments({ course: courseId });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting student count:", error);
    res.status(500).json({
      message: "Error getting student count",
      error: error.message,
    });
  }
});

mongoose
  .connect(
    "mongodb+srv://oguzmeric9:Okul1299@project.xcmad.mongodb.net/?retryWrites=true&w=majority&appName=Project"
  )
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });
