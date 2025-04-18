import React, { useState, useEffect } from "react";
import { Badge, Dropdown, Button, List, Typography, message } from "antd";
import { BellOutlined, DeleteOutlined } from "@ant-design/icons";
import axiosInstance from "../utils/axiosInstance";

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/student/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      message.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(
        `/api/student/notifications/${notificationId}/read`
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      message.error("Failed to mark notification as read");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await axiosInstance.delete(
        `/api/student/notifications/${notificationId}`
      );
      setNotifications((prevNotifications) =>
        prevNotifications.filter((n) => n._id !== notificationId)
      );
      message.success("Notification deleted successfully");
    } catch (error) {
      console.error("Error deleting notification:", error);
      message.error("Failed to delete notification");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const items = {
    items: notifications.map((notification) => ({
      key: notification._id,
      label: (
        <List.Item
          style={{
            backgroundColor: notification.isRead ? "transparent" : "#f0f2f5",
            padding: "8px",
            marginBottom: "4px",
            borderRadius: "4px",
          }}
        >
          <List.Item.Meta
            title={notification.title}
            description={notification.message}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            {!notification.isRead && (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead(notification._id);
                }}
              >
                Mark as Read
              </Button>
            )}
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(notification._id);
              }}
            />
          </div>
        </List.Item>
      ),
    })),
  };

  return (
    <Dropdown
      menu={items}
      trigger={["click"]}
      placement="bottomRight"
      arrow={true}
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button
          icon={<BellOutlined style={{ fontSize: "20px" }} />}
          type="text"
          style={{ padding: "4px 8px" }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;
