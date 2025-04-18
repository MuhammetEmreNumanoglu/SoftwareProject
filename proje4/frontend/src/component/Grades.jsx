import React, { useState } from "react";
import { useNavigate } from "react-router";

const Grades = ({ data }) => {
  const navigate = useNavigate();
  const [expandedGrades, setExpandedGrades] = useState({});

  // Debug log to see what data we're receiving
  console.log("Grades data:", data);
  console.log("Courses:", data.courses);

  // Harf notuna göre renk belirleme
  const getGradeColor = (grade) => {
    if (!grade) return "#333";
    const excellent = ["AA", "BA", "BB"];
    const good = ["CB", "CC"];
    const passing = ["DC", "DD"];

    if (excellent.includes(grade)) return "#2e7d32"; // Koyu yeşil
    if (good.includes(grade)) return "#689f38"; // Yeşil
    if (passing.includes(grade)) return "#ef6c00"; // Turuncu
    if (grade === "FF") return "#c62828"; // Kırmızı
    return "#333"; // Varsayılan
  };

  // Helper function to format instructor name
  const formatInstructorName = (instructor) => {
    // Debug log to see what instructor data we're getting
    console.log("Instructor data:", instructor);

    if (!instructor) return "-";
    // If instructor is already a name string, return it
    if (typeof instructor === "string") return instructor;
    // If it's an object with name property, return the name
    if (instructor.name) return instructor.name;
    // If it's an object with firstName and lastName properties
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName} ${instructor.lastName}`;
    }
    // If it's just an ID, return a placeholder
    return "Öğretim Üyesi";
  };

  return (
    <div
      style={{
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        borderRadius: "4px",
        overflow: "hidden",
        marginTop: "20px",
      }}
    >
      <h2
        style={{
          padding: "15px",
          backgroundColor: "#3f51b5",
          color: "white",
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <i className="fas fa-graduation-cap"></i>
        <span>Ders Notlarım</span>
        <span style={{ marginLeft: "auto", fontSize: "0.9rem" }}>
          Toplam {data.courses.length} ders
        </span>
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th
                style={{
                  padding: "12px",
                  border: "1px solid #ddd",
                  textAlign: "left",
                }}
              >
                Ders Adı
              </th>
              <th
                style={{
                  padding: "12px",
                  border: "1px solid #ddd",
                  textAlign: "left",
                }}
              >
                Öğretim Üyesi
              </th>
              <th
                style={{
                  padding: "12px",
                  border: "1px solid #ddd",
                  textAlign: "left",
                }}
              >
                Harf Notu
              </th>
            </tr>
          </thead>
          <tbody>
            {data.courses.map((grade, index) => (
              <tr
                style={{
                  backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f9",
                }}
              >
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {grade.course?.courseName || "Bilinmeyen Ders"}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {formatInstructorName(grade.course?.instructor)}
                </td>
                <td
                  style={{
                    padding: "12px",
                    border: "1px solid #ddd",
                    color: getGradeColor(grade.letterGrade),
                    fontWeight: "bold",
                  }}
                >
                  {grade.letterGrade || "-"}
                  {(grade.letterGrade == "FF" ||
                    grade.letterGrade == "DD" ||
                    grade.letterGrade == "CD") && (
                    <button
                      style={{
                        padding: "10px 20px",
                        color: "green",

                        cursor: "pointer",
                        transition: "background-color 0.3s",
                        minWidth: "10px",
                      }}
                      className="p-2 ml-5"
                    >
                      !!!
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Grades;
