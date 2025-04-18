import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import Grades from "../../component/Grades";
import {
  message,
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Select,
  Table,
  Descriptions,
  Divider,
} from "antd";
import NotificationDropdown from "../../component/NotificationDropdown";
import "./Dashboard.css"; // Yeni CSS dosyası
import {
  InfoCircleOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import {
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileTextOutlined,
  FileOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    studentInfo: null,
    courses: [],
  });
  const [loading, setLoading] = useState({
    student: true,
    courses: false,
    requests: false,
    messages: false,
    instructors: false,
    availableCourses: false,
  });
  const [error, setError] = useState(null);
  const [showRequests, setShowRequests] = useState(false);
  const [makeupRequests, setMakeupRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [file, setFile] = useState(null);
  const [conversations, setConversations] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);
  // New state variables for course registration
  const [isTakeCoursesModalVisible, setIsTakeCoursesModalVisible] =
    useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [departmentInstructors, setDepartmentInstructors] = useState([]);
  const [showMyCourses, setShowMyCourses] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [isCourseDetailsModalVisible, setIsCourseDetailsModalVisible] =
    useState(false);
  const [showExams, setShowExams] = useState(false);
  const [myCourses, setMyCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [hiddenAnnouncements, setHiddenAnnouncements] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(true);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        setError(null);
        const response = await axiosInstance.get("/api/get/student/info");
        setData((prev) => ({ ...prev, studentInfo: response.data.data }));
        // Öğrenci bilgileri alındıktan sonra duyuruları getir
        fetchAnnouncements();
      } catch (err) {
        setError(err.response?.data?.message || "Öğrenci bilgileri alınamadı");
      } finally {
        setLoading((prev) => ({ ...prev, student: false }));
      }
    };

    fetchStudentInfo();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading((prev) => ({ ...prev, instructors: true }));
      const response = await axiosInstance.get("/api/instructor");
      console.log("Eğitmenler yüklendi:", response.data); // Debug
      setInstructors(response.data);
    } catch (err) {
      console.error("Eğitmen yükleme hatası:", err); // Debug
      setError("Eğitmenler yüklenirken hata oluştu");
    } finally {
      setLoading((prev) => ({ ...prev, instructors: false }));
    }
  };

  const fetchMessages = async (instructorId) => {
    try {
      if (!data.studentInfo?._id) {
        message.error("Öğrenci bilgileri yüklenmedi");
        return;
      }

      console.log("Mesajlar yükleniyor için:", {
        studentId: data.studentInfo._id,
        instructorId,
      }); // Debug

      const response = await axiosInstance.get(
        `/api/messages/${data.studentInfo._id}/${instructorId}`
      );

      console.log("Mesajlar yüklendi:", response.data); // Debug

      setMessages(response.data);
      setActiveConversation(instructorId);
      setSelectedInstructor(instructorId);

      setConversations((prev) => ({
        ...prev,
        [instructorId]: response.data,
      }));

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Mesaj yükleme hatası:", error); // Debug
      message.error("Mesajlar yüklenemedi");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log("Gönder butonuna basıldı");

    // Öğrenci bilgilerinin yüklendiğinden emin ol
    if (!data.studentInfo?._id) {
      console.error("Öğrenci ID'si yüklenmedi:", data.studentInfo);
      message.error("Öğrenci bilgileri yüklenmedi. Lütfen bekleyin...");
      return;
    }

    if (!newMessage.trim()) {
      message.error("Mesaj boş olamaz");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("senderId", data.studentInfo._id); // Bu satırı kontrol et
      formData.append("receiverId", activeConversation);
      formData.append("content", newMessage);
      formData.append("senderModel", "Student");
      formData.append("receiverModel", "Instructor");

      // Debug için formData içeriğini logla
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await axiosInstance.post("/api/messages", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // ... diğer işlemler
    } catch (error) {
      console.error("Mesaj gönderme hatası:", {
        error: error.response?.data,
        status: error.response?.status,
      });
      message.error(error.response?.data?.error || "Mesaj gönderilemedi");
    }
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const makeup = () => {
    navigate("/student/makeup");
  };

  const fetchGrades = async () => {
    try {
      // If already showing grades, hide them
      if (
        data.courses.length > 0 &&
        !showRequests &&
        !showMessages &&
        !showExams &&
        !showMyCourses
      ) {
        setData((prev) => ({ ...prev, courses: [] }));
        return;
      }

      setLoading((prev) => ({ ...prev, courses: true }));
      setError(null);
      const response = await axiosInstance.get("/api/course/getMy");
      console.log("ders notları", response.data);
      setData((prev) => ({ ...prev, courses: response.data.courses || [] }));
      setShowMyCourses(false);
      setShowRequests(false);
      setShowMessages(false);
      setShowExams(false);
    } catch (err) {
      setError(err.response?.data?.message || "Ders notları alınamadı");
    } finally {
      setLoading((prev) => ({ ...prev, courses: false }));
    }
  };

  const fetchMakeupRequests = async () => {
    try {
      // If already showing requests, hide them
      if (showRequests) {
        setShowRequests(false);
        return;
      }

      setLoading((prev) => ({ ...prev, requests: true }));
      setError(null);
      const response = await axiosInstance.get("/api/student/makeup/req");
      setMakeupRequests(response.data);
      setShowRequests(true);
      setShowMyCourses(false);
      setShowMessages(false);
      setShowExams(false);
      setData((prev) => ({ ...prev, courses: [] }));
    } catch (err) {
      setError(err.response?.data?.message || "Büt istekleri alınamadı");
    } finally {
      setLoading((prev) => ({ ...prev, requests: false }));
    }
  };
  const navigateToAnnouncements = () => {
    navigate("/announcement");
  };

  const getGradeColor = (grade) => {
    if (!grade) return "#333";
    const excellent = ["AA", "BA", "BB"];
    const good = ["CB", "CC"];
    const passing = ["DC", "DD"];

    if (excellent.includes(grade)) return "#2e7d32";
    if (good.includes(grade)) return "#689f38";
    if (passing.includes(grade)) return "#ef6c00";
    if (grade === "FF") return "#c62828";
    return "#333";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      case "pending":
        return "#FFC107";
      default:
        return "#9E9E9E";
    }
  };

  const toggleMessages = () => {
    if (!showMessages) {
      fetchInstructors();
      setShowMyCourses(false);
      setShowRequests(false);
      setShowExams(false);
      setData((prev) => ({ ...prev, courses: [] }));
    }
    setShowMessages(!showMessages);
  };

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setExamsLoading(true);
        const response = await axiosInstance.get("/api/exam/student");
        setExams(response.data);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setExamsLoading(false);
      }
    };

    fetchExams();
  }, []);

  const fetchAvailableCourses = async () => {
    try {
      setLoading((prev) => ({ ...prev, availableCourses: true }));
      const response = await axiosInstance.get("/api/course/available");
      console.log("Available courses:", response.data); // Debug log
      setAvailableCourses(response.data);
    } catch (error) {
      console.error("Error fetching available courses:", error);
      message.error(
        error.response?.data?.message || "Dersler yüklenirken hata oluştu"
      );
    } finally {
      setLoading((prev) => ({ ...prev, availableCourses: false }));
    }
  };

  const fetchDepartmentInstructors = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/department/instructors/${data.studentInfo?.department}`
      );
      setDepartmentInstructors(response.data);
    } catch (error) {
      console.error("Error fetching department instructors:", error);
      message.error("Öğretim üyeleri yüklenirken hata oluştu");
    }
  };

  const handleCourseSelection = (selectedCourseIds) => {
    setSelectedCourses(selectedCourseIds);
  };

  const handleCourseRegistration = async () => {
    try {
      console.log("Attempting to register courses:", selectedCourses);

      if (!selectedCourses || selectedCourses.length === 0) {
        message.error("Lütfen en az bir ders seçiniz");
        return;
      }

      if (selectedCourses.length > 5) {
        message.error("En fazla 5 ders seçebilirsiniz");
        return;
      }

      const requestData = {
        courses: selectedCourses,
      };

      console.log("Sending request with data:", requestData);

      const response = await axiosInstance.post(
        "/api/student/register-courses",
        requestData
      );

      // Check if the response indicates success
      if (response.data && response.status === 200) {
        console.log("Registration successful:", response.data);
        message.success(response.data.message || "Dersler başarıyla eklendi");
        setIsTakeCoursesModalVisible(false);
        setSelectedCourses([]); // Reset selected courses

        // Fetch updated grades after a short delay to ensure backend has processed
        setTimeout(() => {
          fetchGrades();
        }, 500);
      } else {
        // Handle unexpected response format
        console.warn("Unexpected response format:", response);
        message.warning(
          "Ders kaydı yapıldı ancak güncel bilgileri almak için sayfayı yenileyiniz"
        );
      }
    } catch (error) {
      console.error("Error registering courses:", error);
      console.error("Error details:", {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message,
      });

      // Check if the error is due to courses already being registered
      if (
        error.response?.status === 400 &&
        error.response?.data?.existingCourses
      ) {
        message.warning("Bazı dersler zaten kayıtlı");
      } else if (error.response?.status === 500) {
        // If it's a 500 error but courses might have been registered
        message.warning(
          "İşlem tamamlandı ancak bir hata oluştu. Ders listesini kontrol ediniz."
        );
        // Still try to fetch grades to show updated list
        fetchGrades();
      } else {
        message.error(
          error.response?.data?.message ||
            "Ders kaydı sırasında bir hata oluştu"
        );
      }

      setIsTakeCoursesModalVisible(false);
    }
  };

  const handleShowCourseDetails = (course) => {
    setSelectedCourseDetails(course);
    setIsCourseDetailsModalVisible(true);
  };

  const handleShowMyCourses = async () => {
    try {
      // If already showing courses, hide them
      if (showMyCourses) {
        setShowMyCourses(false);
        return;
      }

      setLoading((prev) => ({ ...prev, courses: true }));
      setError(null);
      const response = await axiosInstance.get("/api/course/getMy");
      setMyCourses(response.data.courses || []);
      setShowMyCourses(true);
      setShowRequests(false);
      setShowMessages(false);
      setShowExams(false);
    } catch (err) {
      setError(err.response?.data?.message || "Dersler alınamadı");
      message.error("Dersler yüklenirken bir hata oluştu");
    } finally {
      setLoading((prev) => ({ ...prev, courses: false }));
    }
  };

  const handleShowExams = async () => {
    try {
      // If already showing exams, hide them
      if (showExams) {
        setShowExams(false);
        return;
      }

      setExamsLoading(true);
      setShowMyCourses(false);
      setShowRequests(false);
      setShowMessages(false);
      setData((prev) => ({ ...prev, courses: [] }));
      const response = await axiosInstance.get("/api/exam/student");
      setExams(response.data);
      setShowExams(true);
    } catch (error) {
      console.error("Error fetching exams:", error);
      message.error("Sınavlar yüklenirken bir hata oluştu");
    } finally {
      setExamsLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axiosInstance.get("/api/announcement");
      console.log("Duyurular başarıyla alındı!");
      console.log("Backend'den gelen ham duyurular:", response.data);
      console.log("Toplam duyuru sayısı:", response.data.length);
      console.log("Öğrenci departmanı:", data.studentInfo?.department);

      if (response.data.length === 0) {
        console.log("Dikkat: Backend'den hiç duyuru gelmedi!");
      }

      // Her duyurunun departman ve tür bilgisini kontrol et ve düzelt
      const processedAnnouncements = response.data.map((announcement) => {
        // Eğer department bilgisi yoksa, öğrencinin departmanını ata
        if (!announcement.department || announcement.department === "") {
          console.log(`Departman bilgisi eksik duyuru düzeltiliyor:`, {
            id: announcement._id,
            title: announcement.title,
          });
          announcement.department = data.studentInfo?.department || "Genel";
        }

        if (!announcement.type) {
          console.log(`Tür bilgisi eksik duyuru düzeltiliyor:`, {
            id: announcement._id,
            title: announcement.title,
          });
          // Eksik tür bilgisini tamamla
          announcement.type = "normal";
        }

        return announcement;
      });

      console.log("İşlenmiş duyurular:", processedAnnouncements);
      setAnnouncements(processedAnnouncements);
    } catch (error) {
      console.error("Duyurular yüklenirken hata:", error);
      message.error("Duyurular yüklenirken hata oluştu");
    }
  };

  useEffect(() => {
    // Gizli duyuruları local storage'dan al
    const savedHiddenAnnouncements = localStorage.getItem(
      "hiddenAnnouncements"
    );
    if (savedHiddenAnnouncements) {
      setHiddenAnnouncements(JSON.parse(savedHiddenAnnouncements));
    }
  }, []);

  useEffect(() => {
    if (!data.studentInfo?.department) {
      console.log("Öğrenci departman bilgisi henüz yüklenmedi");
      return;
    }

    console.log("Duyurular filtreleniyor...");
    console.log("Seçili tür:", selectedType);
    console.log("Öğrenci departmanı:", data.studentInfo?.department);
    console.log(
      "Toplam duyuru sayısı (filtreleme öncesi):",
      announcements.length
    );

    let filtered = announcements.filter((announcement) => {
      // Duyuru detaylarını logla
      console.log("Duyuru işleniyor:", {
        id: announcement._id,
        title: announcement.title,
        type: announcement.type,
        department: announcement.department,
      });

      // Gizli duyuruları kontrol et
      if (hiddenAnnouncements.includes(announcement._id)) {
        console.log(`Duyuru gizli, gösterilmeyecek: ${announcement._id}`);
        return false;
      }

      // Tür kontrolü
      const typeMatch = selectedType
        ? announcement.type === selectedType
        : true;

      console.log("Duyuru filtreleme sonucu:", {
        id: announcement._id,
        title: announcement.title,
        typeMatch,
        willShow: typeMatch,
      });

      return typeMatch;
    });

    // Tarihe göre sırala (en yeni en üstte)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log("Filtreleme sonrası duyurular:", filtered.length);
    setFilteredAnnouncements(filtered);
  }, [
    announcements,
    selectedType,
    data.studentInfo?.department,
    hiddenAnnouncements,
  ]);

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

  // Duyuru gizleme fonksiyonu ekle
  const hideAnnouncement = (announcementId) => {
    const updatedHiddenAnnouncements = [...hiddenAnnouncements, announcementId];
    setHiddenAnnouncements(updatedHiddenAnnouncements);

    // Local storage'a kaydet
    localStorage.setItem(
      "hiddenAnnouncements",
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

    // Path veya filename'den URL oluştur
    let filename;
    if (file.path) {
      // Handle both forward and backward slashes for cross-platform compatibility
      const pathParts = file.path.split(/[/\\]/);
      filename = pathParts[pathParts.length - 1];
    } else if (file.filename) {
      filename = file.filename;
    }

    if (filename) {
      // Make sure we don't have path duplication
      const cleanFilename = filename.replace(/^uploads[/\\]/, "");
      return `/uploads/${cleanFilename}`;
    }

    // Başka bir durum olursa
    return file.url || "";
  };

  // Dosya tipine göre görüntüleme URL'i oluştur
  const getViewUrl = (file) => {
    // Path veya filename'den URL oluştur
    let filename;

    if (file.path) {
      // Handle both forward and backward slashes for cross-platform compatibility
      const pathParts = file.path.split(/[/\\]/);
      filename = pathParts[pathParts.length - 1];
    } else if (file.filename) {
      filename = file.filename;
    }

    if (filename) {
      // Make sure we don't have path duplication
      const cleanFilename = filename.replace(/^uploads[/\\]/, "");
      return `/uploads/${cleanFilename}`;
    }

    // Başka bir durum olursa
    return file.url || "";
  };

  const handleDownload = async (file) => {
    try {
      console.log("Handling file:", file);

      // For students, we should use the student-specific endpoint
      const fileDetails = {
        originalName: file.originalname || file.name,
        path: file.path,
        filename: file.filename,
        url: file.url,
      };
      console.log("File details:", fileDetails);

      // Get the token for authentication
      const token = localStorage.getItem("token");

      let filename;
      // Determine the filename from either path or filename property
      if (file.path) {
        // Handle both forward and backward slashes for cross-platform compatibility
        const pathParts = file.path.split(/[/\\]/);
        filename = pathParts[pathParts.length - 1];
      } else if (file.filename) {
        filename = file.filename;
      }

      if (filename) {
        try {
          // Use our new student-specific endpoint
          console.log(`Downloading file using student endpoint: ${filename}`);
          const response = await axiosInstance.get(
            `/api/student/files/${filename}`,
            {
              responseType: "blob",
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );

          saveAs(new Blob([response.data]), file.originalname || file.name);
          message.success("Dosya başarıyla indirildi");
          return;
        } catch (downloadErr) {
          console.error("Student download failed:", downloadErr);

          // Fallback to direct URL access
          try {
            // Make sure we don't have path duplication and no backslashes
            const cleanFilename = filename.replace(/^uploads[/\\]/, "");
            const fileUrl = `/uploads/${cleanFilename}`;
            console.log(`Fallback: Attempting to open file at: ${fileUrl}`);
            window.open(fileUrl, "_blank");
            return;
          } catch (urlErr) {
            console.error("URL access failed:", urlErr);
          }
        }
      }

      // If we have a URL, use it as last resort
      if (file.url) {
        console.log(`Opening file with URL: ${file.url}`);
        window.open(file.url, "_blank");
        return;
      }

      message.error(
        "Dosyaya erişilemedi. Lütfen öğretim görevlinizle iletişime geçin."
      );
    } catch (err) {
      console.error("Dosya işleme hatası:", err);
      message.error(
        "Dosya açılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
      );
    }
  };

  if (loading.student) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
        {error}
      </div>
    );
  }

  if (!data.studentInfo) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Student information not found
      </div>
    );
  }

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
        <Title level={2}>Student Dashboard</Title>
        <Space>
          <NotificationDropdown />
          <Button
            type="primary"
            onClick={() => {
              setIsTakeCoursesModalVisible(true);
              fetchAvailableCourses();
              fetchDepartmentInstructors();
            }}
          >
            Ders Seç
          </Button>
          <Button danger onClick={onLogout}>
            Logout
          </Button>
          <Button onClick={navigateToAnnouncements}>
            Duyuruları görüntüle
          </Button>
        </Space>
      </div>

      <Card title="Student Information" style={{ marginBottom: "24px" }}>
        <p>
          <strong>Name:</strong> {data.studentInfo.name}
        </p>
        <p>
          <strong>Surname:</strong> {data.studentInfo.surname}
        </p>
        <p>
          <strong>Student Number:</strong> {data.studentInfo.studentNumber}
        </p>
        <p>
          <strong>Department:</strong> {data.studentInfo.department}
        </p>
        <p>
          <strong>Email:</strong> {data.studentInfo.email}
        </p>
      </Card>

      {/* Kontrol Butonları */}
      <div className="control-buttons">
        <button
          onClick={handleShowMyCourses}
          disabled={loading.courses}
          className={`control-button ${loading.courses ? "loading" : ""}`}
        >
          {loading.courses ? "Yükleniyor..." : "Derslerim"}
        </button>

        <button
          onClick={fetchGrades}
          disabled={loading.courses}
          className={`control-button ${loading.courses ? "loading" : ""}`}
        >
          {loading.courses ? "Yükleniyor..." : "Ders Notlarımı Göster"}
        </button>

        <button
          onClick={fetchMakeupRequests}
          disabled={loading.requests}
          className={`control-button ${loading.requests ? "loading" : ""}`}
        >
          {loading.requests ? "Yükleniyor..." : "Büt İsteklerim"}
        </button>

        <button
          onClick={handleShowExams}
          disabled={examsLoading}
          className={`control-button ${examsLoading ? "loading" : ""}`}
        >
          {examsLoading ? "Yükleniyor..." : "Sınavlarım"}
        </button>

        <button onClick={makeup} className="control-button makeup-button">
          Yeni İstek Oluştur
        </button>
      </div>

      {/* Mesajlaşma Bölümü */}
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
            // EĞİTMEN LİSTELEME BÖLÜMÜ
            <div>
              <h3 style={{ marginBottom: "15px" }}>
                Mesajlaşmak için eğitmen seçin
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "10px",
                }}
              >
                {instructors.map((instructor) => (
                  <div
                    key={instructor._id}
                    onClick={() => {
                      console.log("Eğitmen seçildi:", instructor._id);
                      setActiveConversation(instructor._id);
                      fetchMessages(instructor._id);
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
                      }}
                    >
                      <span>
                        {instructor.name} {instructor.surname}
                      </span>
                      {conversations[instructor._id]?.length > 0 && (
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
                          {conversations[instructor._id].length}
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
                  }}
                >
                  ← Geri Dön
                </button>
                <h3 style={{ margin: 0 }}>
                  {instructors.find((i) => i._id === activeConversation)?.name}{" "}
                  {
                    instructors.find((i) => i._id === activeConversation)
                      ?.surname
                  }
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
                        padding: "8px 12px",
                        marginBottom: "10px",
                        borderRadius: "12px",
                        backgroundColor:
                          msg.senderModel === "Student" ? "#d4edda" : "#f8f9fa",
                        marginLeft:
                          msg.senderModel === "Student" ? "auto" : "0",
                      }}
                    >
                      <p style={{ margin: 0 }}>{msg.message}</p>
                      {msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "block",
                            marginTop: "5px",
                            color: "#1890ff",
                          }}
                        >
                          📎 Ekli Dosya
                        </a>
                      )}
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#666",
                          display: "block",
                          textAlign: "right",
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: "center", color: "#666" }}>
                    Henüz mesaj yok
                  </p>
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
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  style={{
                    cursor: "pointer",
                    padding: "8px",
                    fontSize: "18px",
                  }}
                >
                  📎
                </label>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesaj yazın..."
                  style={{
                    flex: 1,
                    padding: "10px 15px",
                    border: "1px solid #ddd",
                    borderRadius: "20px",
                    outline: "none",
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
      {/* Büt İstekleri */}
      {showRequests && (
        <div className="requests-container">
          <h2>Büt İsteklerim</h2>
          {makeupRequests.length > 0 ? (
            <div className="requests-table-container">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Ders</th>
                    <th>Not</th>
                    <th>Durum</th>
                    <th>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {makeupRequests.map((request) => (
                    <tr key={request._id}>
                      <td>
                        {request.course.courseName} ({request.course.courseCode}
                        )
                      </td>
                      <td
                        style={{
                          color: getGradeColor(request.grade.letterGrade),
                        }}
                      >
                        {request.grade.letterGrade}
                      </td>
                      <td
                        style={{
                          color: getStatusColor(request.status),
                          fontWeight: "bold",
                        }}
                      >
                        {request.status === "pending" && "Beklemede"}
                        {request.status === "approved" && "Onaylandı"}
                        {request.status === "rejected" && "Reddedildi"}
                      </td>
                      <td>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Henüz bütünleme isteği göndermediniz</p>
          )}
        </div>
      )}

      {/* Ders Notları */}
      {data.courses.length > 0 && !showRequests && !showMessages && (
        <Grades data={data} getGradeColor={getGradeColor} />
      )}

      {/* Update Exams Section */}
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
          <h2 style={{ marginBottom: "20px" }}>Sınavlarım</h2>

          {examsLoading ? (
            <p>Yükleniyor...</p>
          ) : exams.length > 0 ? (
            <div style={{ display: "grid", gap: "15px" }}>
              {exams.map((exam) => (
                <Card
                  key={exam._id}
                  title={exam.title}
                  style={{ marginBottom: "10px" }}
                >
                  <p>
                    <strong>Ders:</strong> {exam.course.courseName} (
                    {exam.course.courseCode})
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
                  <p>
                    <strong>Sınav Türü:</strong> {exam.type}
                  </p>
                  {exam.description && (
                    <p>
                      <strong>Açıklama:</strong> {exam.description}
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

      {/* Update My Courses Section */}
      {showMyCourses && myCourses && myCourses.length > 0 && (
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          <h2>Aldığım Dersler</h2>
          <div style={{ display: "grid", gap: "15px" }}>
            {myCourses.map((course) => (
              <Card
                key={course.course._id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
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
                  <div>
                    <h3 style={{ margin: 0 }}>{course.course.courseName}</h3>
                    <p style={{ margin: "5px 0", color: "#666" }}>
                      Harf Notu:{" "}
                      <span
                        style={{ color: getGradeColor(course.letterGrade) }}
                      >
                        {course.letterGrade || "NA"}
                      </span>
                    </p>
                  </div>
                  <Button
                    type="primary"
                    icon={<InfoCircleOutlined />}
                    onClick={() => handleShowCourseDetails(course.course)}
                  >
                    Detaylar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      <Modal
        title="Ders Detayları"
        visible={isCourseDetailsModalVisible}
        onCancel={() => setIsCourseDetailsModalVisible(false)}
        footer={null}
      >
        {selectedCourseDetails && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Ders Adı">
              {selectedCourseDetails.courseName}
            </Descriptions.Item>
            <Descriptions.Item label="Bölüm">
              {selectedCourseDetails.department}
            </Descriptions.Item>
            <Descriptions.Item label="Öğretim Üyesi">
              {selectedCourseDetails.instructor}
            </Descriptions.Item>
            {selectedCourseDetails.description && (
              <Descriptions.Item label="Açıklama">
                {selectedCourseDetails.description}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Take Courses Modal */}
      <Modal
        title="Ders Seçimi"
        open={isTakeCoursesModalVisible}
        onCancel={() => setIsTakeCoursesModalVisible(false)}
        onOk={handleCourseRegistration}
        confirmLoading={loading.availableCourses}
        width={800}
      >
        <div style={{ marginBottom: 24 }}>
          <h4>Bölüm Öğretim Üyeleri</h4>
          <Table
            dataSource={departmentInstructors}
            columns={[
              {
                title: "İsim",
                dataIndex: "name",
                key: "name",
                render: (text, record) => `${record.name} ${record.surname}`,
              },
              {
                title: "Email",
                dataIndex: "email",
                key: "email",
              },
              {
                title: "Uzmanlık",
                dataIndex: "expertise",
                key: "expertise",
              },
            ]}
            size="small"
            pagination={false}
            style={{ marginBottom: 24 }}
          />

          <h4 style={{ marginTop: 16 }}>Mevcut Dersler</h4>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Ders seçiniz"
            onChange={handleCourseSelection}
            loading={loading.availableCourses}
            value={selectedCourses}
          >
            {availableCourses.map((course) => (
              <Option
                key={course._id}
                value={course._id}
                disabled={
                  selectedCourses.length >= 5 &&
                  !selectedCourses.includes(course._id)
                }
              >
                {course.courseName} ({course.courseCode || "No Code"}) -{" "}
                {course.instructorName}
              </Option>
            ))}
          </Select>
          <div style={{ marginTop: 8, color: "#666" }}>
            Not: En fazla 5 ders seçebilirsiniz. Seçilen ders sayısı:{" "}
            {selectedCourses.length}
          </div>
        </div>
      </Modal>

      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>Öğrenci Paneli</Title>
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

      {showAnnouncements && (
        <Card title="Duyurular" style={{ marginBottom: "24px" }}>
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((announcement) => (
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
                  <div style={{ marginTop: "16px" }}>
                    <Divider>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <PaperClipOutlined style={{ marginRight: "8px" }} />
                        <strong>
                          Ekli Dosyalar ({announcement.files.length})
                        </strong>
                      </span>
                    </Divider>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "12px",
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
            ))
          ) : (
            <p>Henüz duyuru bulunmamaktadır.</p>
          )}
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
