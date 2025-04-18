import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

const Makeup = () => {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [requestText, setRequestText] = useState("");
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/course/getMy");
        setStudentInfo(response.data.studentInfo);

        const eligibleCourses = response.data.courses.filter((course) =>
          ["FF", "DD", "DC"].includes(course.letterGrade)
        );
        setCourses(eligibleCourses);
      } catch (err) {
        setError("Failed to load course information");
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const checkRequest = async () => {
      if (selectedCourse) {
        try {
          setLoading(true);
          const response = await axiosInstance.get(
            `/api/makeup/check?courseId=${selectedCourse}`
          );
          if (response.data.grade?.makeupStatus?.requested) {
            setExistingRequest(response.data.existingRequest);
          } else {
            setExistingRequest(null);
          }
        } catch (err) {
          console.error("Error checking existing request:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    checkRequest();
  }, [selectedCourse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !requestText) {
      setError("Please select a course and enter request text");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.post("/api/makeup/request", {
        courseId: selectedCourse,
        text: requestText,
        autoApproved: true, // Automatically approve the request
      });

      setExistingRequest({
        ...response.data.request,
        status: "approved",
      });
      setRequestText("");
      alert("Büt isteği otomatik olarak onaylandı!");

      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/student/dashboard");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Error submitting makeup request"
      );
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/student/dashboard");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Makeup Exam Request</h2>

        {studentInfo && (
          <div style={{ marginBottom: "15px" }}>
            <p>
              <strong>Student:</strong> {studentInfo.name} {studentInfo.surname}
            </p>
            <p>
              <strong>Student Number:</strong> {studentInfo.studentNumber}
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              color: "red",
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "#ffecec",
              borderRadius: "4px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="course"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Select Course:
            </label>
            <select
              id="course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ced4da",
              }}
              disabled={loading || courses.length === 0}
            >
              <option value="">-- Select Course --</option>
              {courses.map((item) => (
                <option key={item.course._id} value={item.course._id}>
                  {item.course.courseName} ({item.course.courseCode}) - Grade:{" "}
                  {item.letterGrade}
                </option>
              ))}
            </select>
            {courses.length === 0 && !loading && (
              <p style={{ color: "#6c757d", marginTop: "5px" }}>
                No eligible courses found for makeup exam request.
              </p>
            )}
          </div>

          {existingRequest && (
            <div
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#e6f7e6", // Always green for approved
                borderRadius: "4px",
                borderLeft: "4px solid #28a745", // Always green for approved
              }}
            >
              <p>
                <strong>Current Request Status:</strong> Approved
                {existingRequest.autoApproved && " (Automatically)"}
              </p>
              <p style={{ marginTop: "5px", fontSize: "0.9rem" }}>
                <em>
                  Created at:{" "}
                  {new Date(existingRequest.createdAt).toLocaleString()}
                </em>
              </p>
            </div>
          )}

          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="requestText"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Request Explanation:
            </label>
            <textarea
              id="requestText"
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                minHeight: "100px",
                border: "1px solid #ced4da",
              }}
              disabled={!!existingRequest || loading || courses.length === 0}
              placeholder="Please explain why you need a makeup exam..."
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              type="button"
              onClick={handleBack}
              style={{
                padding: "8px 15px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={
                !selectedCourse ||
                !requestText ||
                !!existingRequest ||
                loading ||
                courses.length === 0
              }
              style={{
                padding: "8px 15px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                opacity:
                  !selectedCourse ||
                  !requestText ||
                  !!existingRequest ||
                  loading ||
                  courses.length === 0
                    ? 0.5
                    : 1,
              }}
            >
              {loading ? "Processing..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Makeup;
