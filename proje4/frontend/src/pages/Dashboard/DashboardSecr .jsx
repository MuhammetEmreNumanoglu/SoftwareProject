import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Input,
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  message,
  Select,
  DatePicker,
  InputNumber,
} from "antd";
import {
  PaperClipOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  UserOutlined,
  MailOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../utils/axiosInstance";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from 'xlsx'; // Excel dosyalarını okumak için
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const DashboardSecr = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [secretaryInfo, setSecretaryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [form3] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStudentCreateModel, setIsStudentCreateModel] = useState(false);
  const [isInstructorCreateModel, setIsInstructorCreateModel] = useState(false);
  const [isDownloadModalVisible, setIsDownloadModalVisible] = useState(false);
  const [selectedCourseForDownload, setSelectedCourseForDownload] =
    useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isExamCreateModal, setIsExamCreateModal] = useState(false);
  const [examForm] = Form.useForm();
  const [selectedType, setSelectedType] = useState(null);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isFileSelectModalVisible, setIsFileSelectModalVisible] = useState(false);
  const [fileContent, setFileContent] = useState(null); // Dosya içeriğini saklamak için yeni bir state
  const [selectedFileName, setSelectedFileName] = useState(""); // Seçilen dosya adını saklamak için yeni bir state
  const [showFileContent, setShowFileContent] = useState(false); // Dosya içeriğini gösterip göstermeyeceğimizi kontrol eden state

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await axiosInstance.get("/api/course/all");
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
        message.error("Dersler yüklenirken hata oluştu");
      } finally {
        setLoadingCourses(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await axiosInstance.get("/api/department/all");
        setDepartments(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
        message.error("Bölümler yüklenirken hata oluştu");
      }
    };

    fetchCourses();
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchSecretaryInfo = async () => {
      try {
        const response = await axiosInstance.get("/api/get/secretary/info");
        setSecretaryInfo(response.data);
      } catch (e) {
        console.error("Error fetching secretary info:", e);
        setError("Bilgiler yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchSecretaryInfo();
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axiosInstance.get("/api/announcement");
        setAnnouncements(response.data);
        setFilteredAnnouncements(response.data);
      } catch (error) {
        console.error("Duyurular yüklenirken hata:", error);
        message.error("Duyurular yüklenirken hata oluştu");
      }
    };

    fetchAnnouncements();
  }, []);

  const generateWordDocument = (requests, courseName = "Tüm Dersler") => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${courseName} - Onaylanan Başvurular`,
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { after: 400 },
            }),
            ...requests.flatMap((request, index) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Başvuru #${index + 1}`,
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Öğrenci: ", bold: true }),
                  new TextRun(
                    `${request.student?.name || "Bilgi yok"} ${
                      request.student?.surname || ""
                    } (${request.student?.studentNumber || "Bilgi yok"})`
                  ),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Ders: ", bold: true }),
                  new TextRun(
                    `${request.course?.courseName || "Bilgi yok"} (${
                      request.course?.courseCode || "!"
                    })`
                  ),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Notlar: ", bold: true }),
                  new TextRun(
                    `Vize: ${request.grade?.midterm ?? "-"}, Final: ${
                      request.grade?.final ?? "-"
                    }, Harf: ${request.grade?.letterGrade ?? "-"}`
                  ),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Açıklama: ", bold: true }),
                  new TextRun(request.text || "Açıklama yok"),
                ],
              }),
              new Paragraph({ text: "" }), // Boş satır
            ]),
          ],
        },
      ],
    });

    return doc;
  };

  const downloadApprovedRequests = async () => {
    if (!selectedCourseForDownload) {
      message.error("Lütfen bir ders seçiniz");
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/api/secr/makeup-requests/approved?courseId=${selectedCourseForDownload}`
      );

      const selectedCourse = courses.find(
        (c) => c._id === selectedCourseForDownload
      );
      const doc = generateWordDocument(
        response.data,
        selectedCourse?.courseName
      );

      // Word belgesini oluştur ve indir
      Packer.toBlob(doc).then((blob) => {
        saveAs(
          blob,
          `${selectedCourse?.courseName || "onaylanan_basvurular"}.docx`
        );
        message.success("Word belgesi indirildi");
        setIsDownloadModalVisible(false);
      });
    } catch (error) {
      console.error("İndirme hatası:", error);
      message.error("Word belgesi oluşturulurken hata oluştu");
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const showStudentCreateModal = () => {
    setIsStudentCreateModel(true);
  };

  const showInstructorCreateModal = () => {
    setIsInstructorCreateModel(true);
  };

  const showExamCreateModal = () => {
    setIsExamCreateModal(true);
  };

  const navigateToAnnouncements = () => {
    navigate("/announcement");
  };

  const handleStudentSubmit = async (values) => {
    try {
      const response = await axiosInstance.post("/api/student/create", values);
      message.success("Öğrenci başarıyla oluşturuldu");
      form2.resetFields();
      setIsStudentCreateModel(false);
    } catch (e) {
      console.log(e);
      message.error(
        e.response?.data?.message || "Öğrenci oluşturulurken hata oluştu"
      );
    }
  };

  const handleInstructorSubmit = async (values) => {
    try {
      const response = await axiosInstance.post(
        "/api/instructor/create",
        values
      );
      message.success("Öğretim görevlisi başarıyla oluşturuldu");
      form3.resetFields();
      setIsInstructorCreateModel(false);
    } catch (e) {
      console.log(e);
      message.error(
        e.response?.data?.message ||
          "Öğretim görevlisi oluşturulurken hata oluştu"
      );
    }
  };

  const handleExamSubmit = async (values) => {
    try {
      console.log("Submitting exam with values:", values);

      // Validate required fields
      if (
        !values.title ||
        !values.courseId ||
        !values.date ||
        !values.duration ||
        !values.location
      ) {
        message.error("Please fill in all required fields");
        return;
      }

      const examData = {
        title: values.title,
        courseId: values.courseId,
        date: values.date.toISOString(),
        duration: values.duration,
        location: values.location,
        description: values.description || "",
      };

      console.log("Sending exam data:", examData);

      const response = await axiosInstance.post("/api/exam/create", examData);
      console.log("Exam creation response:", response.data);

      message.success("Sınav başarıyla oluşturuldu");
      examForm.resetFields();
      setIsExamCreateModal(false);
    } catch (e) {
      console.error("Error creating exam:", e);
      console.error("Error response:", e.response?.data);

      if (e.response?.status === 403) {
        message.error(
          "Bu işlem için yetkiniz bulunmamaktadır. Lütfen tekrar giriş yapın."
        );
      } else if (e.response?.status === 404) {
        message.error("Seçilen ders bulunamadı.");
      } else if (e.response?.data?.message) {
        message.error(e.response.data.message);
      } else {
        message.error("Sınav oluşturulurken hata oluştu");
      }
    }
  };

  const handleAnnouncementSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("department", values.department);
      formData.append("type", values.type);

      if (fileList.length > 0) {
        fileList.forEach((file) => {
          formData.append("files", file.originFileObj);
        });
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

      message.success("Duyuru başarıyla oluşturuldu");
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchAnnouncements();
    } catch (error) {
      console.error("Duyuru oluşturma hatası:", error);
      message.error("Duyuru oluşturulurken bir hata oluştu");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileList([]);
  };

  const onLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleTypeFilter = (type) => {
    if (type === selectedType) {
      setShowAnnouncements(!showAnnouncements);
      if (!showAnnouncements) {
        setSelectedType(null);
      }
    } else {
      setSelectedType(type);
      setShowAnnouncements(true);
    }
  };

  useEffect(() => {
    if (!announcements) return;

    let filtered = announcements;

    if (selectedType) {
      filtered = filtered.filter(
        (announcement) => announcement.type === selectedType
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredAnnouncements(filtered);
  }, [announcements, selectedType]);

  const showFileSelectModal = () => {
    setIsFileSelectModalVisible(true);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const validFiles = Array.from(files).filter(file => 
        file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      if (validFiles.length === 0) {
        message.error("Lütfen yalnızca PDF veya Excel dosyası seçin.");
        return;
      }

      setFileList(validFiles);
      setSelectedFileName(validFiles[0].name); // Seçilen dosya adını kaydet
      message.success(`${validFiles.length} dosya seçildi.`);
    }
  };

  const handleFileUpload = async () => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("files", file.originFileObj);
    });

    try {
      await axiosInstance.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      message.success("Dosyalar başarıyla yüklendi.");
      setIsFileSelectModalVisible(false);
      setFileList([]);
      setSelectedFileName(""); // Dosya adını sıfırla
      setShowFileContent(false); // Dosya içeriğini gizle
    } catch (error) {
      console.error("Dosya yükleme hatası:", error);
      message.error("Dosya yüklenirken hata oluştu.");
    }
  };

  const readFileContent = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log(jsonData); // JSON verisini konsola yazdır
      setFileContent(jsonData); // İçeriği state'e kaydet
    };
    reader.readAsArrayBuffer(file);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>Yükleniyor...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
        {error}
      </div>
    );
  }

  if (!secretaryInfo) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Sekreter bilgisi bulunamadı
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: "24px" }}>
        Sekreter Paneli
      </Title>

      <Card
        title="Profil Bilgileri"
        style={{ marginBottom: "24px" }}
        extra={
          <Button
            type="default"
            onClick={navigateToAnnouncements}
            icon={<PaperClipOutlined />}
          >
            Duyuruları Görüntüle
          </Button>
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <UserOutlined
            style={{ fontSize: "24px", marginRight: "16px", color: "#1890ff" }}
          />
          <div>
            <Text strong style={{ fontSize: "18px" }}>
              {secretaryInfo.name} {secretaryInfo.surname}
            </Text>
            <div>
              <MailOutlined style={{ marginRight: "8px" }} />
              <Text type="secondary">{secretaryInfo.email}</Text>
            </div>
          </div>
        </div>
      </Card>

      <Space>
        <Button type="primary" icon={<UploadOutlined />} onClick={showModal}>
          Yeni Duyuru
        </Button>
        <Button type="primary" onClick={showStudentCreateModal}>
          Öğrenci Ekle
        </Button>
        <Button type="primary" onClick={showInstructorCreateModal}>
          Öğretim Görevlisi Ekle
        </Button>
        <Button type="primary" onClick={showExamCreateModal}>
          Sınav Ekle
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => setIsDownloadModalVisible(true)}
          style={{ marginLeft: 8 }}
        >
          Onaylananları İndir
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={showFileSelectModal}
          style={{ marginLeft: 8 }}
        >
          Dosya Seç
        </Button>
        <Button danger onClick={onLogout}>
          Çıkış Yap
        </Button>
      </Space>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "24px",
          marginBottom: "24px",
        }}
      >
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
              </Card>
            ))
          ) : (
            <p>Henüz duyuru bulunmamaktadır.</p>
          )}
        </Card>
      )}

      <Modal
        title="Onaylanan Başvuruları İndir"
        open={isDownloadModalVisible}
        onCancel={() => setIsDownloadModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsDownloadModalVisible(false)}>
            İptal
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={downloadApprovedRequests}
            disabled={!selectedCourseForDownload}
            loading={loadingCourses}
          >
            İndir
          </Button>,
        ]}
      >
        <Select
          style={{ width: "100%" }}
          placeholder="Ders seçin"
          onChange={(value) => setSelectedCourseForDownload(value)}
          loading={loadingCourses}
        >
          {courses.map((course) => (
            <Select.Option key={course._id} value={course._id}>
              {course.courseName} ({course.courseCode})
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* Student Creation Modal */}
      <Modal
        title="Yeni Öğrenci Oluştur"
        open={isStudentCreateModel}
        onCancel={() => setIsStudentCreateModel(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={form2} layout="vertical" onFinish={handleStudentSubmit}>
          <Form.Item
            name="name"
            label="Ad"
            rules={[
              { required: true, message: "Lütfen öğrenci adını giriniz!" },
            ]}
          >
            <Input placeholder="Öğrenci adını giriniz" />
          </Form.Item>

          <Form.Item
            name="surname"
            label="Soyad"
            rules={[
              { required: true, message: "Lütfen öğrenci soyadını giriniz!" },
            ]}
          >
            <Input placeholder="Öğrenci soyadını giriniz" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Lütfen email adresini giriniz!" },
              { type: "email", message: "Geçerli bir email adresi giriniz!" },
            ]}
          >
            <Input placeholder="Email adresini giriniz" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Bölüm"
            rules={[{ required: true, message: "Lütfen bölüm seçiniz!" }]}
          >
            <Select placeholder="Bölüm seçiniz">
              {departments.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="studentNumber"
            label="Öğrenci Numarası"
            rules={[
              { required: true, message: "Lütfen öğrenci numarasını giriniz!" },
            ]}
          >
            <Input placeholder="Öğrenci numarasını giriniz" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Şifre"
            rules={[
              { required: true, message: "Lütfen şifre giriniz!" },
              { min: 3, message: "Şifre en az 3 karakter olmalıdır!" },
            ]}
          >
            <Input.Password placeholder="Şifre giriniz" />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setIsStudentCreateModel(false)}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                Oluştur
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Instructor Creation Modal */}
      <Modal
        title="Yeni Öğretim Görevlisi Oluştur"
        open={isInstructorCreateModel}
        onCancel={() => setIsInstructorCreateModel(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={form3} layout="vertical" onFinish={handleInstructorSubmit}>
          <Form.Item
            name="name"
            label="Ad"
            rules={[{ required: true, message: "Lütfen ad giriniz!" }]}
          >
            <Input placeholder="Ad giriniz" />
          </Form.Item>

          <Form.Item
            name="surname"
            label="Soyad"
            rules={[{ required: true, message: "Lütfen soyad giriniz!" }]}
          >
            <Input placeholder="Soyad giriniz" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Lütfen email adresini giriniz!" },
              { type: "email", message: "Geçerli bir email adresi giriniz!" },
            ]}
          >
            <Input placeholder="Email adresini giriniz" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Bölüm"
            rules={[{ required: true, message: "Lütfen bölüm seçiniz!" }]}
          >
            <Select placeholder="Bölüm seçiniz">
              {departments.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="Şifre"
            rules={[
              { required: true, message: "Lütfen şifre giriniz!" },
              { min: 3, message: "Şifre en az 3 karakter olmalıdır!" },
            ]}
          >
            <Input.Password placeholder="Şifre giriniz" />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setIsInstructorCreateModel(false)}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                Oluştur
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Exam Creation Modal */}
      <Modal
        title="Yeni Sınav Oluştur"
        open={isExamCreateModal}
        onCancel={() => setIsExamCreateModal(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={examForm} layout="vertical" onFinish={handleExamSubmit}>
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
            name="courseId"
            label="Ders"
            rules={[{ required: true, message: "Lütfen ders seçiniz!" }]}
          >
            <Select placeholder="Ders seçiniz">
              {courses.map((course) => (
                <Option key={course._id} value={course._id}>
                  {course.courseName} ({course.courseCode})
                </Option>
              ))}
            </Select>
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

          <Form.Item>
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setIsExamCreateModal(false)}>İptal</Button>
              <Button type="primary" htmlType="submit">
                Oluştur
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Announcement Creation Modal */}
      <Modal
        title="Yeni Duyuru Oluştur"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAnnouncementSubmit}>
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
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
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
              <Select.Option value="finals">Finaller</Select.Option>
              <Select.Option value="makeup">Bütler</Select.Option>
              <Select.Option value="normal">Normal</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="İçerik"
            rules={[{ required: true, message: "Lütfen içerik giriniz!" }]}
          >
            <Input.TextArea placeholder="Duyuru içeriğini giriniz" rows={4} />
          </Form.Item>

          <Form.Item label="Dosya Ekle (Maks. 10MB)">
            <Upload
              listType="picture"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Dosya Seç</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setIsModalVisible(false)}>İptal</Button>
              <Button type="primary" htmlType="submit">
                Oluştur
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Dosya Seçim Modalı */}
      <Modal
        title="Dosya Seç"
        visible={isFileSelectModalVisible}
        onCancel={() => setIsFileSelectModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsFileSelectModalVisible(false)}>
            İptal
          </Button>,
          <Button key="submit" type="primary" onClick={handleFileUpload}>
            Gönder
          </Button>,
        ]}
      >
        <input
          type="file"
          id="fileInput"
          style={{ display: 'none' }}
          accept=".xlsx,.xls,.pdf" // Sadece Excel ve PDF dosyalarını kabul et
          onChange={(e) => {
            handleFileChange(e);
            const files = e.target.files;
            if (files.length > 0) {
              readFileContent(files[0]); // İlk dosyanın içeriğini oku
            }
          }}
        />
        <Button onClick={() => document.getElementById('fileInput').click()}>
          Dosya Seç
        </Button>

        {selectedFileName && (
          <div style={{ marginTop: "16px", fontWeight: "bold" }}>
            Seçilen Dosya: {selectedFileName}
          </div>
        )}
      </Modal>

      {showFileContent && fileContent && (
        <div style={{ marginTop: "16px" }}>
          <h3>Dosya İçeriği:</h3>
          <pre>{JSON.stringify(fileContent, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DashboardSecr;
