import React, { useState, useEffect } from "react";
import { Button, Card, Title } from "@/components/ui";
import { message } from "antd";
import axiosInstance from "@/lib/axiosInstance";

const DashboardInstr = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (selectedType) {
      setFilteredAnnouncements(
        announcements.filter(
          (announcement) => announcement.type === selectedType
        )
      );
    } else {
      setFilteredAnnouncements(announcements);
    }
  }, [announcements, selectedType]);

  const fetchAnnouncements = async () => {
    try {
      const response = await axiosInstance.get("/api/announcement");
      setAnnouncements(response.data);
      setFilteredAnnouncements(response.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      message.error("Duyurular yüklenirken hata oluştu");
    }
  };

  const handleTypeFilter = (type) => {
    setSelectedType(type === selectedType ? null : type);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>Öğretim Görevlisi Paneli</Title>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <Button type="primary" onClick={() => handleTypeFilter(null)}>
          Tüm Duyurular
        </Button>
        <Button type="primary" onClick={() => handleTypeFilter("normal")}>
          Normal Bildirimler
        </Button>
        <Button type="primary" onClick={() => handleTypeFilter("finals")}>
          Final Duyuruları
        </Button>
        <Button type="primary" onClick={() => handleTypeFilter("makeup")}>
          Büt Duyuruları
        </Button>
        <Button type="primary" onClick={showAnnouncementCreateModal}>
          Yeni Duyuru
        </Button>
        <Button type="primary" onClick={showExamCreateModal}>
          Sınav Ekle
        </Button>
        <Button danger onClick={onLogout}>
          Çıkış Yap
        </Button>
      </div>

      <Card title="Duyurular" style={{ marginBottom: "24px" }}>
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement._id}
              style={{ marginBottom: "16px" }}
              title={announcement.title}
            >
              <p>{announcement.content}</p>
              <p style={{ color: "#666", fontSize: "12px" }}>
                Tür:{" "}
                {announcement.type === "finals"
                  ? "Final Duyurusu"
                  : announcement.type === "makeup"
                  ? "Büt Duyurusu"
                  : "Normal Duyuru"}
              </p>
              <p style={{ color: "#666", fontSize: "12px" }}>
                {new Date(announcement.createdAt).toLocaleString()}
              </p>
              {announcement.files && announcement.files.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <strong>Ekler:</strong>
                  {announcement.files.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", marginTop: "4px" }}
                    >
                      {file.name}
                    </a>
                  ))}
                </div>
              )}
            </Card>
          ))
        ) : (
          <p>Henüz duyuru bulunmamaktadır.</p>
        )}
      </Card>
    </div>
  );
};

export default DashboardInstr;
