import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  message,
  Modal,
  Card,
  Space,
  Typography,
} from "antd";
import axiosInstance from "../../utils/axiosInstance";
import { DownloadOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const DashboardSecr = () => {
  const [isExamCreateModal, setIsExamCreateModal] = useState(false);
  const [examForm] = Form.useForm();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get("/api/course/all");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      message.error("Dersler yüklenirken hata oluştu");
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

  const showExamCreateModal = () => {
    setIsExamCreateModal(true);
  };

  const handleExamSubmit = async (values) => {
    try {
      const response = await axiosInstance.post("/api/exam/create", {
        title: values.title,
        courseId: values.courseId,
        date: values.date.toISOString(),
        duration: values.duration,
        location: values.location,
        description: values.description,
      });
      message.success("Sınav başarıyla oluşturuldu");
      examForm.resetFields();
      setIsExamCreateModal(false);
    } catch (e) {
      console.log(e);
      message.error(
        e.response?.data?.message || "Sınav oluşturulurken hata oluştu"
      );
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
        "/api/announcement/create",
        formData
      );
      message.success("Duyuru başarıyla oluşturuldu");
      announcementForm.resetFields();
      setIsAnnouncementCreateModal(false);
    } catch (e) {
      console.log(e);
      message.error(
        e.response?.data?.message || "Duyuru oluşturulurken hata oluştu"
      );
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>Sekreter Paneli</Title>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <Button type="primary" icon={<DownloadOutlined />}>
          Yeni Duyuru
        </Button>
        <Button type="primary">Öğrenci Ekle</Button>
        <Button type="primary">Öğretim Görevlisi Ekle</Button>
        <Button type="primary" /*onClick={showExamCreateModal}*/>
          Sınav Ekle
        </Button>
        <Button danger>Çıkış Yap</Button>
        <Button type="primary" icon={<DownloadOutlined />}>
          Onaylananları İndir
        </Button>
      </div>

      <Card title="Profil Bilgileri" style={{ marginBottom: "24px" }}>
        <p>
          <strong>Ad Soyad:</strong> Derviş Yılmaz
        </p>
        <p>
          <strong>Email:</strong> dervis@gmail.com
        </p>
      </Card>

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
    </div>
  );
};

export default DashboardSecr;
