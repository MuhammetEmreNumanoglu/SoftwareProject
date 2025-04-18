import React, { useState, useEffect } from "react";
import {
  Space,
  Modal,
  Button,
  InputNumber,
  message,
  Table,
  Tabs,
  Descriptions,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import axios from "axios";

const { TabPane } = Tabs;

const Courses = ({
  courses,
  grades,
  gradesLoading,
  fetchStudentGrades,
  onUpdateGrade,
}) => {
  const [openCourses, setOpenCourses] = useState({});
  const [isGradeModalVisible, setIsGradeModalVisible] = useState(false);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [midterm, setMidterm] = useState(0);
  const [finalOrMakeup, setFinalOrMakeup] = useState(0);
  const [activeTab, setActiveTab] = useState("final");
  const [instructorDetails, setInstructorDetails] = useState(null);
  const [studentCount, setStudentCount] = useState(0);

  const fetchInstructorDetails = async (instructorId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/instructor/${instructorId}`
      );
      setInstructorDetails(response.data);
    } catch (error) {
      console.error("Error fetching instructor details:", error);
      message.error("Öğretim üyesi bilgileri yüklenirken hata oluştu");
    }
  };

  const fetchStudentCount = async (courseId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/course/${courseId}/students/count`
      );
      setStudentCount(response.data.count);
    } catch (error) {
      console.error("Error fetching student count:", error);
      setStudentCount(0);
    }
  };

  const toggleGrades = async (courseId) => {
    if (openCourses[courseId]) {
      setOpenCourses((prev) => ({ ...prev, [courseId]: false }));
      return;
    }

    try {
      await fetchStudentGrades(courseId);
      setOpenCourses((prev) => ({ ...prev, [courseId]: true }));
    } catch (error) {
      console.error("Notlar yüklenirken hata:", error);
      message.error("Notlar yüklenirken hata oluştu");
    }
  };

  const handleEditGrade = (grade) => {
    setSelectedGrade(grade);
    setMidterm(grade.midterm);
    setFinalOrMakeup(grade.final);
    setIsGradeModalVisible(true);

    // Eğer öğrenci büt alamıyorsa, direkt final sekmesine geç
    if (!grade.makeup && !grade.makeupApproved) {
      setActiveTab("final");
    }
  };

  const handleUpdateGrade = async () => {
    try {
      const payload = {
        midterm,
        ...(activeTab === "makeup" && { büt: finalOrMakeup }),
        ...(activeTab === "final" && { final: finalOrMakeup }),
      };

      await onUpdateGrade(selectedGrade._id, payload);

      message.success("Not başarıyla güncellendi");
      setIsGradeModalVisible(false);
      await fetchStudentGrades(selectedGrade.course._id);
    } catch (error) {
      console.error("Not güncelleme hatası:", error);
      message.error(
        error.response?.data?.message || "Not güncellenirken hata oluştu"
      );

      // Eğer büt notu girilemiyorsa, final sekmesine geç
      if (error.response?.data?.message?.includes("büt notu alamaz")) {
        setActiveTab("final");
      }
    }
  };

  const handleShowInfo = (course) => {
    console.log("Course Data:", course);
    setSelectedCourse(course);
    setIsInfoModalVisible(true);
    if (course.instructor) {
      fetchInstructorDetails(course.instructor);
      fetchStudentCount(course._id);
    }
  };

  // Reset states when modal is closed
  const handleCloseModal = () => {
    setIsInfoModalVisible(false);
    setInstructorDetails(null);
    setStudentCount(0);
  };

  const columns = [
    {
      title: "Öğrenci",
      dataIndex: "student",
      key: "student",
      render: (_, record) => (
        <span>
          {record.student?.name} {record.student?.surname}
          <br />
          <small>{record.student?.studentNumber}</small>
        </span>
      ),
    },
    {
      title: "Vize",
      dataIndex: "midterm",
      key: "midterm",
      align: "center",
      render: (midterm) => midterm || "-",
    },
    {
      title: "Final/Büt",
      key: "final",
      align: "center",
      render: (_, record) => (
        <span className={record.makeupApproved ? "makeup-grade" : ""}>
          {record.final || "-"}
          {record.makeupApproved && (
            <div>
              <small>(Büt)</small>
            </div>
          )}
        </span>
      ),
    },
    {
      title: "Harf Notu",
      dataIndex: "letterGrade",
      key: "letterGrade",
      align: "center",
      render: (grade) => grade || "-",
    },
    {
      title: "İşlemler",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEditGrade(record)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <div className="courses-container">
      <h2>Verdiğim Dersler</h2>

      {courses.map((course) => (
        <div key={course._id} className="course-card">
          <div className="course-header">
            <div className="course-info">
              <h3>
                {course.courseName}
                <small> ({course.courseCode})</small>
              </h3>
              <p className="department">{course.department}</p>
            </div>
            <Space>
              <Button
                icon={<InfoCircleOutlined />}
                onClick={() => handleShowInfo(course)}
                type="text"
              />
              <Button
                type={openCourses[course._id] ? "default" : "primary"}
                onClick={() => toggleGrades(course._id)}
                loading={gradesLoading[course._id]}
              >
                {gradesLoading[course._id]
                  ? "Yükleniyor..."
                  : openCourses[course._id]
                  ? "Notları Gizle"
                  : "Notları Göster"}
              </Button>
            </Space>
          </div>

          {openCourses[course._id] && grades[course._id] && (
            <div className="grades-table-container">
              <Table
                columns={columns}
                dataSource={grades[course._id]}
                rowKey={(record) => record._id}
                pagination={false}
                bordered
                size="small"
                locale={{
                  emptyText: "Bu derse ait not bulunamadı",
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Course Info Modal */}
      <Modal
        title="Ders Detayları"
        visible={isInfoModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        {selectedCourse && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Ders Adı">
              {selectedCourse.courseName}
            </Descriptions.Item>
            <Descriptions.Item label="Bölüm">
              {selectedCourse.department}
            </Descriptions.Item>
            <Descriptions.Item label="Kayıtlı Öğrenci Sayısı">
              {studentCount} öğrenci
            </Descriptions.Item>
            {selectedCourse.description && (
              <Descriptions.Item label="Açıklama">
                {selectedCourse.description}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Not Düzenleme Modalı */}
      <Modal
        title={`Not Düzenle - ${selectedGrade?.student?.name || ""} ${
          selectedGrade?.student?.surname || ""
        }`}
        visible={isGradeModalVisible}
        onOk={handleUpdateGrade}
        onCancel={() => setIsGradeModalVisible(false)}
        okText="Güncelle"
        cancelText="İptal"
        width={600}
        destroyOnClose
      >
        {selectedGrade && (
          <div className="grade-edit-modal">
            <div className="info-section">
              <p>
                <strong>Ders:</strong> {selectedGrade.course?.courseName}
              </p>
              <p>
                <strong>Öğrenci No:</strong>{" "}
                {selectedGrade.student?.studentNumber}
              </p>
            </div>

            <div className="grade-inputs">
              <div className="input-group">
                <label>Vize Notu:</label>
                <InputNumber
                  min={0}
                  max={100}
                  value={midterm}
                  onChange={setMidterm}
                  style={{ width: "100%" }}
                />
              </div>

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                className="grade-tabs"
              >
                <TabPane tab="Final Notu" key="final">
                  <div className="input-group">
                    <label>Final Notu:</label>
                    <InputNumber
                      min={0}
                      max={100}
                      value={finalOrMakeup}
                      onChange={setFinalOrMakeup}
                      style={{ width: "100%" }}
                    />
                  </div>
                </TabPane>
                <TabPane
                  tab="Büt Notu"
                  key="makeup"
                  disabled={
                    !selectedGrade.makeup && !selectedGrade.makeupApproved
                  }
                >
                  <div className="input-group">
                    <label>Büt Notu:</label>
                    <InputNumber
                      min={0}
                      max={100}
                      value={finalOrMakeup}
                      onChange={setFinalOrMakeup}
                      style={{ width: "100%" }}
                    />
                    <p className="help-text">
                      Not: Büt notu girildiğinde, bu not final notu yerine
                      geçecektir.
                    </p>
                  </div>
                </TabPane>
              </Tabs>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Courses;
