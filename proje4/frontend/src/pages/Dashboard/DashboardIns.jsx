import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import Courses from "../../component/Courses";
import {
  Modal,
  Button,
  Form,
  InputNumber,
  message,
  Select,
  Input,
  Card,
  Space,
  Typography,
  Upload,
  DatePicker,
  Spin,
} from "antd";
import "./Dashboard.css"; // Yeni CSS dosyası
import InstructorNotificationDropdown from "../../component/InstructorNotificationDropdown";
import { UploadOutlined } from "@ant-design/icons";
import moment from "moment";
import {
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { saveAs } from "file-saver";

const { Title, Text } = Typography;
const { TextArea } = Input;

const DashboardIns = () => {
  const navigate = useNavigate();

  // Bölümler listesi
  const departments = [
    "Bilgisayar Mühendisliği",
    "Elektrik-Elektronik Mühendisliği",
    "Makine Mühendisliği",
    "Endüstri Mühendisliği",
    "İnşaat Mühendisliği",
    "Genel",
  ];

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [grades, setGrades] = useState({});
  const [gradesLoading, setGradesLoading] = useState({});
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showApprovedRequests, setShowApprovedRequests] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isAddGradeModalVisible, setIsAddGradeModalVisible] = useState(false);
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);
  const [isAnnouncementModalVisible, setIsAnnouncementModalVisible] =
    useState(false);
  const [fileList, setFileList] = useState([]);
  const [announcementForm] = Form.useForm();
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [form] = Form.useForm();
  const [courseForm] = Form.useForm();
  const [notifications, setNotifications] = useState([]);
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [showExams, setShowExams] = useState(false);
  const [isExamEditModalVisible, setIsExamEditModalVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examForm] = Form.useForm();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const [conversations, setConversations] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [hiddenAnnouncements, setHiddenAnnouncements] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [showMakeupRequests, setShowMakeupRequests] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [showGrades, setShowGrades] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axiosInstance.get(
          "/api/instructor/notifications"
        );
        setNotifications(response.data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchInstructorInfo = async () => {
      try {
        const response = await axiosInstance.get("/api/get/ins/getMy");
        setData(response.data);
        setLoading(false);
      } catch (e) {
        console.error("Error fetching instructor info:", e);
        setError("Error loading instructor information");
        setLoading(false);
      }
    };

    fetchInstructorInfo();
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setExamsLoading(true);
        const response = await axiosInstance.get("/api/exam/instructor");
        setExams(response.data);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setExamsLoading(false);
      }
    };

    fetchExams();
  }, []);

  useEffect(() => {
    // Gizli duyuruları local storage'dan al
    const savedHiddenAnnouncements = localStorage.getItem(
      "hiddenAnnouncementsIns"
    );
    if (savedHiddenAnnouncements) {
      setHiddenAnnouncements(JSON.parse(savedHiddenAnnouncements));
    }
  }, []);

  useEffect(() => {
    // Sadece duyuruları getir, gösterme
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    // Eğer showAnnouncements false ise hiçbir şey gösterme
    if (!showAnnouncements) {
      setFilteredAnnouncements([]);
      return;
    }

    // Duyuruları filtrele
    let filtered = announcements.filter(
      (announcement) => !hiddenAnnouncements.includes(announcement._id)
    );

    // Eğer bir tür seçili ise o türe göre filtrele
    if (selectedType) {
      filtered = filtered.filter(
        (announcement) => announcement.type === selectedType
      );
    }

    // Tarihe göre sırala (en yeni en üstte)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredAnnouncements(filtered);
  }, [announcements, selectedType, hiddenAnnouncements, showAnnouncements]);

  const fetchAnnouncements = async () => {
    try {
      const response = await axiosInstance.get("/api/announcement");
      setAnnouncements(response.data);
      // Duyuruları getirdikten sonra filteredAnnouncements'ı boş bırak
      setFilteredAnnouncements([]);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      message.error("Duyurular yüklenirken hata oluştu");
    }
  };

  const handleTypeFilter = (type) => {
    if (type === selectedType) {
      // Aynı butona tıklandığında toggle yap
      setShowAnnouncements(!showAnnouncements);
      if (!showAnnouncements) {
        setSelectedType(null);
      }
    } else {
      // Farklı butona tıklandığında
      setSelectedType(type);
      setShowAnnouncements(true);
    }
  };

  const handleShowExams = () => {
    setShowExams(!showExams);

    // If showing exams, hide other sections
    if (!showExams) {
      setShowApprovedRequests(false);
      setShowMessages(false);
    }
  };

  const fetchMessages = async (studentId) => {
    try {
      if (!data?._id) {
        message.error("Eğitmen bilgileri yüklenmedi");
        return;
      }

      const response = await axiosInstance.get(
        `/api/messages/${studentId}/${data._id}`
      );

      setMessages(response.data);
      setActiveConversation(studentId);

      setConversations((prev) => ({
        ...prev,
        [studentId]: response.data,
      }));

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Mesaj yükleme hatası:", error);
      message.error("Mesajlar yüklenemedi");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!data?._id) {
      message.error("Eğitmen bilgileri yüklenmedi");
      return;
    }

    if (!newMessage.trim()) {
      message.error("Mesaj boş olamaz");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("senderId", data._id);
      formData.append("receiverId", activeConversation);
      formData.append("content", newMessage);
      formData.append("senderModel", "Instructor");
      formData.append("receiverModel", "Student");
      console.log(data._id);

      const response = await axiosInstance.post("/api/messages", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setNewMessage("");
      await fetchMessages(activeConversation);
      message.success("Mesaj gönderildi");
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      message.error(error.response?.data?.error || "Mesaj gönderilemedi");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleMessages = async () => {
    if (!showMessages) {
      await fetchStudents();
    }
    setShowMessages(!showMessages);
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await axiosInstance.get("/api/student");
      setStudents(response.data);
    } catch (e) {
      console.error("Öğrenciler yüklenirken hata:", e);
      message.error("Öğrenciler yüklenirken hata oluştu");
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await axiosInstance.get("/api/getMy/course");
      setCourses(response.data);
    } catch (e) {
      console.error("Dersler yüklenirken hata:", e);
      setError("Dersler yüklenirken hata oluştu");
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchStudentGrades = async (courseId) => {
    try {
      setGradesLoading((prev) => ({ ...prev, [courseId]: true }));
      const response = await axiosInstance.get(
        `/api/ins/getMy/students?courseId=${courseId}`
      );
      setGrades((prev) => ({ ...prev, [courseId]: response.data }));
    } catch (e) {
      console.error("Notlar yüklenirken hata:", e);
      setError(`${courseId} dersine ait notlar yüklenirken hata oluştu`);
    } finally {
      setGradesLoading((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const fetchApprovedRequests = async () => {
    try {
      setRequestsLoading(true);
      const response = await axiosInstance.get(
        "/api/instructor/makeup-requests/approved"
      );
      setApprovedRequests(response.data);
      setShowApprovedRequests(true);

      // Hide other sections
      setShowMessages(false);
    } catch (e) {
      console.error("Approved requests error:", e);
      setError("Onaylanan istekler yüklenirken hata oluştu");
    } finally {
      setRequestsLoading(false);
    }
  };

  const showAddGradeModal = () => {
    fetchStudents();
    fetchMyCourses();
    setIsAddGradeModalVisible(true);
  };

  const handleAddGradeCancel = () => {
    setIsAddGradeModalVisible(false);
    form.resetFields();
  };

  const showCourseModal = () => {
    setIsCourseModalVisible(true);
  };

  const handleCourseCancel = () => {
    setIsCourseModalVisible(false);
    courseForm.resetFields();
  };

  const handleAddGradeSubmit = async (values) => {
    try {
      const response = await axiosInstance.post("/api/grade/create", {
        studentNumber: values.studentNumber,
        midterm: values.midterm,
        final: values.final,
        courseId: values.courseId,
      });

      message.success(response.data.message);
      setIsAddGradeModalVisible(false);
      form.resetFields();

      if (values.courseId) {
        await fetchStudentGrades(values.courseId);
      }
    } catch (error) {
      console.error("Not ekleme hatası:", error);
      message.error(
        error.response?.data?.message || "Not eklenirken hata oluştu"
      );
    }
  };

  const handleCourseSubmit = async (values) => {
    try {
      const response = await axiosInstance.post("/api/course/create", {
        courseName: values.courseName,
        department: values.department,
      });

      message.success(response.data.message);
      setIsCourseModalVisible(false);
      courseForm.resetFields();
      fetchMyCourses();
    } catch (error) {
      console.error("Ders oluşturma hatası:", error);
      message.error(
        error.response?.data?.message || "Ders oluşturulurken hata oluştu"
      );
    }
  };

  const handleUpdateGrade = async (gradeId, { midterm, final, büt }) => {
    try {
      await axiosInstance.put(`/api/grade/update/${gradeId}`, {
        midterm,
        final: final !== undefined ? final : undefined,
        büt: büt !== undefined ? büt : undefined,
      });
    } catch (error) {
      console.error("Not güncelleme hatası:", error);
      throw error;
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await axiosInstance.put(`/api/instructor/makeup-requests/${requestId}`, {
        status: action,
      });

      fetchApprovedRequests();
      fetchMyCourses();
    } catch (e) {
      console.error("Update request error:", e);
      setError("İşlem sırasında hata oluştu");
    }
  };
  const navigateToAnnouncements = () => {
    navigate("/announcement");
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/login");
  };

  const showAnnouncementModal = () => {
    setIsAnnouncementModalVisible(true);
  };

  const handleAnnouncementCancel = () => {
    setIsAnnouncementModalVisible(false);
    announcementForm.resetFields();
    setFileList([]);
  };

  const handleAnnouncementSubmit = async (values) => {
    try {
      console.log("Form values:", values); // Debug log for form values

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("department", values.department);
      formData.append("type", values.type);

      console.log("Selected type:", values.type); // Debug log for type

      if (fileList.length > 0) {
        fileList.forEach((file) => {
          formData.append("files", file.originFileObj);
        });
      }

      // Log the FormData entries
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      const response = await axiosInstance.post(
        "/api/announcement/add",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Response:", response.data); // Debug log for response

      message.success("Duyuru başarıyla oluşturuldu");
      setIsAnnouncementModalVisible(false);
      announcementForm.resetFields();
      setFileList([]);
      await fetchAnnouncements();
    } catch (error) {
      console.error("Duyuru oluşturma hatası:", error);
      message.error(error.response?.data?.message || "Duyuru oluşturulamadı");
    }
  };

  const handleExamEdit = (exam) => {
    setSelectedExam(exam);
    examForm.setFieldsValue({
      title: exam.title,
      date: moment(exam.date),
      duration: exam.duration,
      location: exam.location,
      description: exam.description,
      type: exam.type,
    });
    setIsExamEditModalVisible(true);
  };

  const handleExamEditSubmit = async (values) => {
    try {
      const response = await axiosInstance.put(
        `/api/exam/update/${selectedExam._id}`,
        {
          ...values,
          date: values.date.toISOString(),
        }
      );

      message.success("Sınav başarıyla güncellendi");
      setIsExamEditModalVisible(false);
      examForm.resetFields();
      setSelectedExam(null);

      // Refresh exams list
      const updatedExams = await axiosInstance.get("/api/exam/instructor");
      setExams(updatedExams.data);
    } catch (error) {
      console.error("Error updating exam:", error);
      message.error(
        error.response?.data?.message || "Sınav güncellenirken hata oluştu"
      );
    }
  };

  // Duyuru gizleme fonksiyonu ekle
  const hideAnnouncement = (announcementId) => {
    const updatedHiddenAnnouncements = [...hiddenAnnouncements, announcementId];
    setHiddenAnnouncements(updatedHiddenAnnouncements);

    // Local storage'a kaydet
    localStorage.setItem(
      "hiddenAnnouncementsIns",
      JSON.stringify(updatedHiddenAnnouncements)
    );

    message.success("Duyuru gizlendi");
  };

  // Dosya tipine göre simge döndüren yardımcı fonksiyon
  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return (
          <FilePdfOutlined style={{ fontSize: "20px", color: "#ff4d4f" }} />
        );
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
        return (
          <FileImageOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
        );
      case "doc":
      case "docx":
        return (
          <FileWordOutlined style={{ fontSize: "20px", color: "#2a5699" }} />
        );
      case "xls":
      case "xlsx":
        return (
          <FileExcelOutlined style={{ fontSize: "20px", color: "#217346" }} />
        );
      case "ppt":
      case "pptx":
        return (
          <FilePptOutlined style={{ fontSize: "20px", color: "#d24726" }} />
        );
      case "zip":
      case "rar":
      case "7z":
        return (
          <FileZipOutlined style={{ fontSize: "20px", color: "#faad14" }} />
        );
      case "txt":
        return (
          <FileTextOutlined style={{ fontSize: "20px", color: "#8c8c8c" }} />
        );
      default:
        return <FileOutlined style={{ fontSize: "20px", color: "#8c8c8c" }} />;
    }
  };

  // Dosya görüntülenebilir mi?
  const isViewable = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    return ["pdf", "jpg", "jpeg", "png", "gif", "bmp", "txt"].includes(
      extension
    );
  };

  // Dosya URL'lerini oluşturmak için yardımcı fonksiyon
  const getFileUrl = (file) => {
    // Eğer tam URL varsa onu kullan
    if (file.url && file.url.startsWith("http")) {
      return file.url;
    }

    // Eğer path varsa, doğru filename'i çıkar
    if (file.path) {
      // Path'den sadece dosya adını al, "uploads/" önekini kaldır
      const pathParts = file.path.split("/");
      const filename = pathParts[pathParts.length - 1];
      return `/api/files/${filename}?originalname=${encodeURIComponent(
        file.originalname || file.name
      )}`;
    }

    // Eğer sadece filename varsa
    if (file.filename) {
      return `/api/files/${file.filename}?originalname=${encodeURIComponent(
        file.originalname || file.name
      )}`;
    }

    // Başka bir durum olursa
    return file.url || "";
  };

  // Dosya tipine göre görüntüleme URL'i oluştur
  const getViewUrl = (file) => {
    // Resim dosyaları için doğrudan uploads klasörüne yönlendir
    const extension = (file.originalname || file.name || "")
      .split(".")
      .pop()
      .toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "bmp"].includes(extension);

    if (isImage) {
      // Path'den sadece dosya adını al veya filename'i kullan
      let filename;
      if (file.path) {
        const pathParts = file.path.split("/");
        filename = pathParts[pathParts.length - 1];
      } else {
        filename = file.filename;
      }

      if (filename) {
        return `/uploads/${filename}`;
      }
    }

    // Diğer görüntülenebilir dosyalar için api endpoint'i kullan
    return getFileUrl(file);
  };

  // handleDownload fonksiyonunu ekle
  const handleDownload = async (file) => {
    try {
      // Dosya filename kullanarak indirme
      if (file.filename) {
        const response = await axiosInstance.get(
          `/api/files/${file.filename}`,
          {
            responseType: "blob",
          }
        );
        saveAs(new Blob([response.data]), file.originalname || file.name);
        return;
      }

      // Eğer path varsa path'den filename çıkarma
      if (file.path) {
        const pathParts = file.path.split("/");
        const filename = pathParts[pathParts.length - 1];
        const response = await axiosInstance.get(`/api/files/${filename}`, {
          responseType: "blob",
        });
        saveAs(new Blob([response.data]), file.originalname || file.name);
        return;
      }

      // URL varsa direkt URL ile indirme
      if (file.url) {
        window.open(file.url, "_blank");
      }
    } catch (err) {
      console.error("Dosya indirme hatası:", err);
      message.error("Dosya indirilirken hata oluştu");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Instructor information not found
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: { bg: "#FFC107", text: "Bekliyor" },
      approved: { bg: "#4CAF50", text: "Onaylandı" },
      rejected: { bg: "#F44336", text: "Reddedildi" },
    };

    return (
      <span
        style={{
          backgroundColor: statusColors[status].bg,
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "0.8rem",
        }}
      >
        {statusColors[status].text}
      </span>
    );
  };

  const renderRequestsTable = () => {
    if (requestsLoading) {
      return (
        <div style={{ textAlign: "center", padding: "20px" }}>
          Yükleniyor...
        </div>
      );
    }

    if (approvedRequests.length === 0) {
      return <p>Onaylanan istek bulunmamaktadır.</p>;
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#e9ecef" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Öğrenci</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Ders</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Not</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Açıklama</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Durum</th>
            </tr>
          </thead>
          <tbody>
            {approvedRequests.map((request) => (
              <tr
                key={request._id}
                style={{ borderBottom: "1px solid #dee2e6" }}
              >
                <td style={{ padding: "12px" }}>
                  {request.student?.name} {request.student?.surname}
                  <br />({request.student?.studentNumber})
                </td>
                <td style={{ padding: "12px" }}>
                  {request.course?.courseName}
                  <br />({request.course?.courseCode})
                </td>
                <td style={{ padding: "12px" }}>
                  {request.grade?.letterGrade}
                  <br />
                  (Vize: {request.grade?.midterm}, Final: {request.grade?.final}
                  )
                </td>
                <td style={{ padding: "12px" }}>
                  {request.text || "Açıklama yok"}
                </td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                    }}
                  >
                    Onaylandı
                    {request.autoApproved && " (Otomatik)"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <Title level={2}>Instructor Dashboard</Title>
        <Space>
          <InstructorNotificationDropdown />
          <Button type="primary" onClick={showAnnouncementModal}>
            Yeni Duyuru
          </Button>
          <Button danger onClick={onLogout}>
            Logout
          </Button>
          <Button onClick={navigateToAnnouncements}>
            Duyuruları görüntüle
          </Button>
        </Space>
      </div>

      <Card title="Instructor Information" style={{ marginBottom: "24px" }}>
        <p>
          <strong>Name:</strong> {data.name}
        </p>
        <p>
          <strong>Surname:</strong> {data.surname}
        </p>
        <p>
          <strong>Department:</strong> {data.department}
        </p>
        <p>
          <strong>Email:</strong> {data.email}
        </p>
      </Card>

      {/* Kontrol Butonları */}
      <div className="control-buttons">
        <button
          onClick={() => {
            setShowCourses(!showCourses);
            if (!showCourses) {
              fetchMyCourses();
            }
            // Diğer panelleri kapat
            setShowGrades(false);
            setShowMakeupRequests(false);
            setShowExams(false);
          }}
          className={`control-button ${showCourses ? "active" : ""}`}
        >
          Derslerim
        </button>

        <button onClick={showCourseModal} className="control-button">
          Ders Ekle
        </button>

        <button
          onClick={() => {
            setShowMakeupRequests(!showMakeupRequests);
            if (!showMakeupRequests) {
              fetchApprovedRequests();
            }
            // Diğer panelleri kapat
            setShowCourses(false);
            setShowGrades(false);
            setShowExams(false);
          }}
          className={`control-button ${showMakeupRequests ? "active" : ""}`}
        >
          Büt İstekleri
        </button>

        <button
          onClick={() => {
            setShowGrades(!showGrades);
            if (!showGrades) {
              fetchMyCourses();
            }
            // Diğer panelleri kapat
            setShowCourses(false);
            setShowMakeupRequests(false);
            setShowExams(false);
          }}
          className={`control-button ${showGrades ? "active" : ""}`}
        >
          Not Ekle
        </button>

        <button
          onClick={() => {
            setShowExams(!showExams);
            // Diğer panelleri kapat
            setShowCourses(false);
            setShowGrades(false);
            setShowMakeupRequests(false);
          }}
          className={`control-button ${showExams ? "active" : ""}`}
        >
          Sınavlarım
        </button>

        <button onClick={showAnnouncementModal} className="control-button">
          Yeni Duyuru Oluştur
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>Öğretim Görevlisi Paneli</Title>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <Button
          type={
            selectedType === null && showAnnouncements ? "primary" : "default"
          }
          onClick={() => handleTypeFilter(null)}
        >
          Tüm Duyurular
        </Button>
        <Button
          type={
            selectedType === "normal" && showAnnouncements
              ? "primary"
              : "default"
          }
          onClick={() => handleTypeFilter("normal")}
        >
          Normal Bildirimler
        </Button>
        <Button
          type={
            selectedType === "finals" && showAnnouncements
              ? "primary"
              : "default"
          }
          onClick={() => handleTypeFilter("finals")}
        >
          Finaller Bildirimleri
        </Button>
        <Button
          type={
            selectedType === "makeup" && showAnnouncements
              ? "primary"
              : "default"
          }
          onClick={() => handleTypeFilter("makeup")}
        >
          Bütler Bildirimleri
        </Button>
        <Button danger onClick={onLogout}>
          Çıkış Yap
        </Button>
      </div>

      {/* Duyurular sadece showAnnouncements true ise gösterilecek */}
      {showAnnouncements && filteredAnnouncements.length > 0 && (
        <Card title="Duyurular" style={{ marginBottom: "24px" }}>
          {filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement._id}
              style={{ marginBottom: "16px" }}
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{announcement.title}</span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor:
                          announcement.department &&
                          announcement.department !== "Genel"
                            ? "#1890ff"
                            : "#87d068",
                        color: "white",
                      }}
                    >
                      {announcement.department &&
                      announcement.department !== "Genel"
                        ? announcement.department
                        : "Tüm Bölümler"}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor:
                          announcement.type === "finals"
                            ? "#ff4d4f"
                            : announcement.type === "makeup"
                            ? "#faad14"
                            : "#52c41a",
                        color: "white",
                      }}
                    >
                      {announcement.type === "finals"
                        ? "Final Duyurusu"
                        : announcement.type === "makeup"
                        ? "Büt Duyurusu"
                        : "Normal Duyuru"}
                    </span>
                  </div>
                </div>
              }
              extra={
                <Button
                  type="text"
                  danger
                  onClick={() => hideAnnouncement(announcement._id)}
                  style={{ padding: "0 8px" }}
                >
                  Sil
                </Button>
              }
            >
              <p>{announcement.content}</p>
              <div
                style={{ marginTop: "8px", color: "#666", fontSize: "12px" }}
              >
                <p>
                  <strong>Departman:</strong>{" "}
                  {announcement.department &&
                  announcement.department !== "Genel"
                    ? announcement.department
                    : "Tüm Bölümler için Genel Duyuru"}
                </p>
                <p>
                  <strong>Tür:</strong>{" "}
                  {announcement.type === "finals"
                    ? "Final Duyurusu"
                    : announcement.type === "makeup"
                    ? "Büt Duyurusu"
                    : "Normal Duyuru"}
                </p>
                <p>
                  <strong>Tarih:</strong>{" "}
                  {new Date(announcement.createdAt).toLocaleString()}
                </p>
              </div>
              {announcement.files && announcement.files.length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    border: "1px solid #f0f0f0",
                    borderRadius: "4px",
                    padding: "12px",
                  }}
                >
                  <h4
                    style={{
                      marginTop: 0,
                      borderBottom: "1px solid #f0f0f0",
                      paddingBottom: "8px",
                    }}
                  >
                    Dosya Ekleri ({announcement.files.length})
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {announcement.files.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "8px",
                          backgroundColor: "#f9f9f9",
                          borderRadius: "4px",
                          border: "1px solid #eee",
                        }}
                      >
                        <div style={{ marginRight: "10px" }}>
                          {getFileIcon(file.originalname || file.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "500" }}>
                            {file.originalname || file.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#888" }}>
                            {file.size
                              ? `${(file.size / 1024).toFixed(2)} KB`
                              : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {isViewable(file.originalname || file.name) && (
                            <Button
                              type="primary"
                              icon={<EyeOutlined />}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(getViewUrl(file), "_blank");
                              }}
                            >
                              Görüntüle
                            </Button>
                          )}
                          <Button
                            icon={<DownloadOutlined />}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                          >
                            İndir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </Card>
      )}

      {/* Duyuru yoksa ve showAnnouncements true ise mesaj göster */}
      {showAnnouncements && filteredAnnouncements.length === 0 && (
        <Card title="Duyurular" style={{ marginBottom: "24px" }}>
          <p>Henüz duyuru bulunmamaktadır.</p>
        </Card>
      )}

      {/* Bütünleme İstekleri Bölümü */}
      {showApprovedRequests && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#333" }}>Onaylanan İstekler</h2>
          </div>

          {renderRequestsTable()}
        </div>
      )}

      {/* Sınavlar Bölümü */}
      {showExams && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#333" }}>Sınavlarım</h2>
            <Button
              type="primary"
              onClick={() => {
                setIsExamEditModalVisible(true);
                examForm.resetFields();
                setSelectedExam(null);
              }}
            >
              Yeni Sınav Ekle
            </Button>
          </div>

          {examsLoading ? (
            <Spin tip="Sınavlar yükleniyor..." />
          ) : exams.length > 0 ? (
            <div style={{ display: "grid", gap: "15px" }}>
              {exams.map((exam) => (
                <Card
                  key={exam._id}
                  title={exam.title}
                  style={{ marginBottom: "10px" }}
                  extra={
                    <Button
                      type="primary"
                      onClick={() => handleExamEdit(exam)}
                      style={{ backgroundColor: "#1890ff" }}
                    >
                      Düzenle
                    </Button>
                  }
                >
                  <p>
                    <strong>Ders:</strong> {exam.course?.courseName} (
                    {exam.course?.courseCode})
                  </p>
                  <p>
                    <strong>Tarih:</strong>{" "}
                    {new Date(exam.date).toLocaleString()}
                  </p>
                  <p>
                    <strong>Süre:</strong> {exam.duration} dakika
                  </p>
                  <p>
                    <strong>Yer:</strong> {exam.location}
                  </p>
                  {exam.description && (
                    <p>
                      <strong>Açıklama:</strong> {exam.description}
                    </p>
                  )}
                  <p>
                    <strong>Tür:</strong> {exam.type}
                  </p>
                  <p>
                    <strong>Oluşturan:</strong>{" "}
                    {exam.createdBy?.name || "Bilinmiyor"}
                  </p>
                  {exam.editedBy && (
                    <p>
                      <strong>Son Düzenleyen:</strong>{" "}
                      {exam.editedBy?.name || "Bilinmiyor"} (
                      {new Date(exam.lastEditedAt).toLocaleString()})
                    </p>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p>Henüz sınav bulunmamaktadır.</p>
          )}
        </div>
      )}

      {showMessages && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
            backgroundColor: "#f9f9f9",
            marginBottom: "20px",
            minHeight: "500px",
          }}
        >
          {!activeConversation ? (
            // ÖĞRENCİ LİSTELEME BÖLÜMÜ
            <div>
              <h3 style={{ marginBottom: "15px" }}>
                Mesajlaşmak için öğrenci seçin
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "10px",
                }}
              >
                {students.map((student) => (
                  <div
                    key={student._id}
                    onClick={() => {
                      setActiveConversation(student._id);
                      fetchMessages(student._id);
                    }}
                    style={{
                      padding: "15px",
                      border: "1px solid #eee",
                      borderRadius: "5px",
                      cursor: "pointer",
                      backgroundColor: "#fff",
                      transition: "all 0.3s",
                      ":hover": {
                        borderColor: "#1890ff",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      },
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {student.name} {student.surname} (
                        {student.studentNumber})
                      </span>
                      {conversations[student._id]?.length > 0 && (
                        <span
                          style={{
                            backgroundColor: "#ff4d4f",
                            color: "white",
                            borderRadius: "50%",
                            width: "22px",
                            height: "22px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                          }}
                        >
                          {conversations[student._id].length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // MESAJLAŞMA BÖLÜMÜ
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {/* BAŞLIK VE GERİ BUTONU */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "10px",
                  marginBottom: "15px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <button
                  onClick={() => setActiveConversation(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#1890ff",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  ← Geri Dön
                </button>
                <h3 style={{ margin: 0 }}>
                  {students.find((s) => s._id === activeConversation)?.name}{" "}
                  {students.find((s) => s._id === activeConversation)?.surname}{" "}
                  (
                  {
                    students.find((s) => s._id === activeConversation)
                      ?.studentNumber
                  }
                  )
                </h3>
              </div>

              {/* MESAJ LİSTESİ */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  marginBottom: "15px",
                  padding: "10px",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  border: "1px solid #eee",
                }}
              >
                {messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      style={{
                        maxWidth: "70%",
                        padding: "12px",
                        marginBottom: "10px",
                        borderRadius: "12px",
                        backgroundColor:
                          msg.senderModel === "Instructor"
                            ? "#e6f7ff"
                            : "#f5f5f5",
                        marginLeft:
                          msg.senderModel === "Instructor" ? "auto" : "0",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          marginBottom: "5px",
                          color:
                            msg.senderModel === "Instructor"
                              ? "#1890ff"
                              : "#333",
                        }}
                      >
                        {msg.senderModel === "Instructor"
                          ? "Siz"
                          : `${
                              students.find((s) => s._id === msg.senderId)?.name
                            } ${
                              students.find((s) => s._id === msg.senderId)
                                ?.surname
                            }`}
                      </div>
                      <p style={{ margin: 0, wordBreak: "break-word" }}>
                        {msg.message}
                      </p>
                      {msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-block",
                            marginTop: "5px",
                            color: "#1890ff",
                            textDecoration: "none",
                          }}
                        >
                          📎 Ekli Dosya
                        </a>
                      )}
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#666",
                          textAlign: "right",
                          marginTop: "5px",
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#666",
                      padding: "20px",
                    }}
                  >
                    <p>Henüz mesaj yok</p>
                    <p>İlk mesajı siz göndererek konuşmayı başlatın</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* MESAJ YAZMA FORMU */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  display: "flex",
                  gap: "10px",
                  paddingTop: "10px",
                  borderTop: "1px solid #eee",
                }}
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesaj yazın..."
                  style={{
                    flex: 1,
                    padding: "12px 15px",
                    border: "1px solid #ddd",
                    borderRadius: "20px",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />

                <button
                  type="submit"
                  style={{
                    padding: "0 20px",
                    background: "#1890ff",
                    color: "white",
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "background-color 0.3s",
                    ":hover": {
                      backgroundColor: "#40a9ff",
                    },
                    ":disabled": {
                      backgroundColor: "#d9d9d9",
                      cursor: "not-allowed",
                    },
                  }}
                  disabled={!newMessage.trim()}
                >
                  Gönder
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Dersler Bölümü */}
      {showCourses && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#333" }}>Derslerim</h2>
          </div>

          {courses.length > 0 && (
            <Courses
              courses={courses}
              grades={grades}
              gradesLoading={gradesLoading}
              fetchStudentGrades={fetchStudentGrades}
              onUpdateGrade={handleUpdateGrade}
            />
          )}
        </div>
      )}

      {/* Notlar Bölümü */}
      {showGrades && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#333" }}>Ders Notları</h2>
          {courses.length > 0 && (
            <Courses
              courses={courses}
              grades={grades}
              gradesLoading={gradesLoading}
              fetchStudentGrades={fetchStudentGrades}
              onUpdateGrade={handleUpdateGrade}
              showOnlyGrades={true}
            />
          )}
        </div>
      )}

      {/* Not Ekleme Modalı */}
      <Modal
        title="Yeni Not Ekle"
        visible={isAddGradeModalVisible}
        onCancel={handleAddGradeCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddGradeSubmit}>
          <Form.Item
            name="studentNumber"
            label="Öğrenci Numarası"
            rules={[{ required: true, message: "Öğrenci numarası gerekli" }]}
          >
            <Select
              showSearch
              placeholder="Öğrenci seçin"
              optionFilterProp="children"
              loading={studentsLoading}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {students.map((student) => (
                <Select.Option
                  key={student.studentNumber}
                  value={student.studentNumber}
                >
                  {student.studentNumber} - {student.name} {student.surname}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="courseId"
            label="Ders"
            rules={[{ required: true, message: "Ders seçimi gerekli" }]}
          >
            <Select placeholder="Ders seçin">
              {courses.map((course) => (
                <Select.Option key={course._id} value={course._id}>
                  {course.courseName} ({course.courseCode})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="midterm"
            label="Vize Notu"
            rules={[
              { required: true, message: "Vize notu gerekli" },
              {
                type: "number",
                min: 0,
                max: 100,
                message: "0-100 arası değer girin",
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="final"
            label="Final Notu"
            rules={[
              { required: true, message: "Final notu gerekli" },
              {
                type: "number",
                min: 0,
                max: 100,
                message: "0-100 arası değer girin",
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginRight: "10px" }}
            >
              Kaydet
            </Button>
            <Button onClick={handleAddGradeCancel}>İptal</Button>
          </Form.Item>
        </Form>
      </Modal>
      {/* Ders Oluşturma Modalı */}
      <Modal
        title="Yeni Ders Oluştur"
        visible={isCourseModalVisible}
        onCancel={handleCourseCancel}
        footer={null}
      >
        <Form
          form={courseForm}
          layout="vertical"
          onFinish={handleCourseSubmit}
          initialValues={{ department: data?.department }}
        >
          <Form.Item
            name="courseName"
            label="Ders Adı"
            rules={[{ required: true, message: "Ders adı gerekli" }]}
          >
            <Input placeholder="Ders adını girin" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Bölüm"
            rules={[{ required: true, message: "Bölüm bilgisi gerekli" }]}
          >
            <Input
              value={data?.department}
              placeholder={data?.department}
              disabled
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginRight: "10px" }}
            >
              Oluştur
            </Button>
            <Button onClick={handleCourseCancel}>İptal</Button>
          </Form.Item>
        </Form>
      </Modal>
      {/* Announcement Creation Modal */}
      <Modal
        title="Yeni Duyuru Oluştur"
        visible={isAnnouncementModalVisible}
        onCancel={handleAnnouncementCancel}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={announcementForm}
          layout="vertical"
          onFinish={handleAnnouncementSubmit}
          initialValues={{ type: "normal" }} // Varsayılan değer
        >
          <Form.Item
            name="title"
            label="Başlık"
            rules={[{ required: true, message: "Lütfen başlık giriniz!" }]}
          >
            <Input placeholder="Duyuru başlığını giriniz" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Bölüm"
            rules={[{ required: true, message: "Lütfen bölüm seçiniz!" }]}
          >
            <Select placeholder="Bölüm seçiniz">
              {departments.map((dept) => (
                <Select.Option key={dept} value={dept}>
                  {dept}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="Duyuru Türü"
            rules={[
              { required: true, message: "Lütfen duyuru türünü seçiniz!" },
            ]}
          >
            <Select placeholder="Duyuru türünü seçiniz">
              <Select.Option value="finals">Final Duyurusu</Select.Option>
              <Select.Option value="makeup">Büt Duyurusu</Select.Option>
              <Select.Option value="normal">Normal Duyuru</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="İçerik"
            rules={[{ required: true, message: "Lütfen içerik giriniz!" }]}
          >
            <TextArea rows={6} placeholder="Duyuru içeriğini yazınız..." />
          </Form.Item>

          <Form.Item label="Dosya Ekle (Maks. 10MB)">
            <Upload
              multiple
              fileList={fileList}
              beforeUpload={(file) => {
                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error("Dosya boyutu 10MB üzerinde olamaz!");
                  return false;
                }
                return false;
              }}
              onChange={({ fileList }) => setFileList(fileList)}
            >
              <Button icon={<UploadOutlined />}>Dosya Seç</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <Button onClick={handleAnnouncementCancel}>İptal</Button>
              <Button type="primary" htmlType="submit">
                Yayınla
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      {/* Add Exam Edit Modal */}
      <Modal
        title="Sınavı Düzenle"
        visible={isExamEditModalVisible}
        onCancel={() => {
          setIsExamEditModalVisible(false);
          examForm.resetFields();
          setSelectedExam(null);
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={examForm} layout="vertical" onFinish={handleExamEditSubmit}>
          <Form.Item
            name="title"
            label="Sınav Başlığı"
            rules={[
              { required: true, message: "Lütfen sınav başlığını giriniz!" },
            ]}
          >
            <Input placeholder="Sınav başlığını giriniz" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Sınav Tarihi"
            rules={[
              { required: true, message: "Lütfen sınav tarihini seçiniz!" },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Sınav Süresi (Dakika)"
            rules={[
              { required: true, message: "Lütfen sınav süresini giriniz!" },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="location"
            label="Sınav Yeri"
            rules={[
              { required: true, message: "Lütfen sınav yerini giriniz!" },
            ]}
          >
            <Input placeholder="Sınav yerini giriniz" />
          </Form.Item>

          <Form.Item name="description" label="Açıklama">
            <TextArea rows={4} placeholder="Sınav hakkında açıklama giriniz" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Sınav Türü"
            rules={[
              { required: true, message: "Lütfen sınav türünü seçiniz!" },
            ]}
          >
            <Select placeholder="Sınav türünü seçiniz">
              <Select.Option value="oral">Sözlü</Select.Option>
              <Select.Option value="written">Yazılı</Select.Option>
              <Select.Option value="classical">Klasik</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <Button
                onClick={() => {
                  setIsExamEditModalVisible(false);
                  examForm.resetFields();
                  setSelectedExam(null);
                }}
              >
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                Güncelle
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DashboardIns;
