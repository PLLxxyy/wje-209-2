import React, { useState, useEffect, useCallback } from 'react';
import { Notification as NotificationType, Page } from '../types';
import { apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead } from '../api';

interface Props {
  onNavigate: (page: Page, meetupId?: number) => void;
  onReadChange: () => void;
}

export default function Notifications({ onNavigate, onReadChange }: Props) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGetNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('加载通知失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await apiMarkAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      onReadChange();
    } catch (err) {
      console.error('标记失败:', err);
    }
  };

  const handleClick = async (n: NotificationType) => {
    if (!n.is_read) {
      try {
        await apiMarkNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_read: 1 } : item))
        );
        onReadChange();
      } catch (err) {
        console.error('标记已读失败:', err);
      }
    }
    if (n.meetup_id) {
      onNavigate('detail', n.meetup_id);
    }
  };

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return <div className="loading-spinner">加载中...</div>;
  }

  return (
    <div>
      <div className="page-title">
        <div className="title-text">
          <span role="img" aria-label="bell">🔔</span>
          消息通知
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            全部已读
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-text">暂无消息</div>
          <div className="empty-sub">有人加入你的饭局时，你会在这里收到通知</div>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-item ${!n.is_read ? 'unread' : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className="notification-avatar">
                {n.actor_name ? n.actor_name.charAt(0) : '🔔'}
              </div>
              <div className="notification-content">
                <div className="notification-title">{n.title}</div>
                <div className="notification-body">{n.body}</div>
                <div className="notification-time">{formatTime(n.created_at)}</div>
              </div>
              {!n.is_read && <div className="notification-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
