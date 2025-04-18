import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import {
  PaperClipOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { Button, Card, Typography, Divider } from "antd";

const { Title, Text } = Typography;

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axiosInstance.get("/api/announcement");
        console.log("API Response:", response.data);
        setAnnouncements(response.data);
      } catch (err) {
        setError("Duyurular yüklenirken hata oluştu");
        console.error("Duyuru yükleme hatası:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleDownload = async (file) => {
    try {
      const response = await axiosInstance.get(`/api/files/${file.filename}`, {
        responseType: "blob",
      });
      saveAs(new Blob([response.data]), file.originalname);
    } catch (err) {
      console.error("Dosya indirme hatası:", err);
      message.error("Dosya indirilirken hata oluştu");
    }
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FileOutlined className="text-gray-500" />;

    const type = mimeType.split("/")[0];
    switch (type) {
      case "image":
        return <FileImageOutlined className="text-blue-400" />;
      case "application":
        if (mimeType.includes("pdf")) {
          return <FilePdfOutlined className="text-red-400" />;
        } else if (mimeType.includes("word")) {
          return <FileWordOutlined className="text-blue-600" />;
        } else if (mimeType.includes("excel")) {
          return <FileExcelOutlined className="text-green-600" />;
        }
        return <FileOutlined className="text-gray-500" />;
      default:
        return <FileOutlined className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded">
        <p>{error}</p>
        <Button
          type="primary"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Yeniden Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Title level={2} className="!mb-0">
          Duyurular
        </Title>
      </div>

      <Divider />

      {announcements.length === 0 ? (
        <Card className="text-center py-10">
          <Text type="secondary" className="text-lg">
            Henüz duyuru bulunmamaktadır
          </Text>
        </Card>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <Card
              key={announcement._id}
              className="hover:shadow-lg transition-shadow"
              title={
                <div className="flex justify-between">
                  <Text strong className="text-lg">
                    {announcement.title}
                  </Text>
                  <Text type="secondary">
                    {new Date(announcement.createdAt).toLocaleDateString(
                      "tr-TR"
                    )}
                  </Text>
                </div>
              }
            >
              <div className="whitespace-pre-line mb-4">
                {announcement.content}
              </div>

              {announcement.files?.length > 0 && (
                <div className="mb-4">
                  <Divider orientation="left" plain>
                    <PaperClipOutlined className="mr-2" />
                    <Text strong>
                      Ekli Dosyalar ({announcement.files.length})
                    </Text>
                  </Divider>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {announcement.files.map((file, index) => (
                      <Card
                        key={index}
                        hoverable
                        onClick={() => handleDownload(file)}
                        className="!p-3"
                      >
                        <div className="flex items-center">
                          <div className="mr-3">
                            {getFileIcon(file.mimetype)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Text strong ellipsis className="block">
                              {file.originalname}
                            </Text>
                            <Text type="secondary" className="text-xs">
                              {file.mimetype?.split("/")[1]?.toUpperCase() ||
                                "DOSYA"}{" "}
                              • {(file.size / 1024).toFixed(1)} KB
                            </Text>
                          </div>
                          <DownloadOutlined className="text-blue-500" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Divider className="!my-3" />

              <div className="flex justify-between items-center text-sm">
                <div>
                  <UserOutlined className="mr-1" />
                  <Text strong className="mr-2">
                    {announcement.secretary?.name ||
                      announcement.instructor?.name ||
                      "Sistem"}
                  </Text>
                  <Text type="secondary" className="text-xs mr-2">
                    ({announcement.secretary ? "Sekreter" : "Öğretim Görevlisi"}
                    )
                  </Text>
                  {(announcement.secretary?.email ||
                    announcement.instructor?.email) && (
                    <Text type="secondary" className="text-xs">
                      (
                      {announcement.secretary?.email ||
                        announcement.instructor?.email}
                      )
                    </Text>
                  )}
                </div>
                <Text type="secondary">
                  {new Date(announcement.createdAt).toLocaleTimeString(
                    "tr-TR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </Text>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcement;
