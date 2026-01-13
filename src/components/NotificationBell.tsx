import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialIcon } from './MaterialIcon';
import {
  loadNotificationState,
  getActiveNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  addNotification,
} from '../utils/notificationStorage';
import {
  checkAndGenerateTimeBasedNotifications,
  generateWelcomeNotification,
} from '../utils/notificationGenerator';
import {
  type Notification,
  getNotificationTypeInfo,
} from '../types/notification';
import './NotificationBell.css';

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNotificationClick,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasCheckedRef = useRef(false);

  // Load notifications and check for time-based notifications
  const refreshNotifications = useCallback(() => {
    const active = getActiveNotifications();
    setNotifications(active);
    setUnreadCount(getUnreadCount());
  }, []);

  // Check for time-based notifications on mount (once per session)
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const state = loadNotificationState();
    
    // Generate time-based notifications
    const newNotifications = checkAndGenerateTimeBasedNotifications(
      state.preferences,
      state.lastChecked
    );
    
    // Add any new time-based notifications
    newNotifications.forEach(notification => {
      addNotification(notification);
    });
    
    // If no notifications at all and this appears to be a new user, add welcome
    if (state.notifications.length === 0 && newNotifications.length === 0) {
      addNotification(generateWelcomeNotification());
    }
    
    refreshNotifications();
  }, [refreshNotifications]);

  // Refresh on open
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markNotificationAsRead(notification.id);
    refreshNotifications();
    
    // Navigate if action URL provided
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
    
    onNotificationClick?.(notification);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    refreshNotifications();
  };

  const handleToggleReadStatus = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    if (notification.read) {
      markNotificationAsUnread(notification.id);
    } else {
      markNotificationAsRead(notification.id);
    }
    refreshNotifications();
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification(notificationId);
    refreshNotifications();
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return then.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={panelRef}>
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MaterialIcon name="notifications" />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel" role="menu" aria-label="Notifications">
          <div className="notification-panel-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllRead}
                aria-label="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <MaterialIcon name="notifications_none" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => {
                const typeInfo = getNotificationTypeInfo(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'} priority-${notification.priority.toLowerCase()}`}
                    onClick={() => handleNotificationClick(notification)}
                    role="menuitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    <div className="notification-icon">
                      <MaterialIcon name={typeInfo.icon} />
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatTimeAgo(notification.timestamp)}</div>
                    </div>
                    <div className="notification-actions">
                      <button
                        className="notification-read-btn"
                        onClick={(e) => handleToggleReadStatus(e, notification)}
                        aria-label={notification.read ? 'Mark as unread' : 'Mark as read'}
                        title={notification.read ? 'Mark as unread' : 'Mark as read'}
                      >
                        <MaterialIcon name={notification.read ? 'mark_email_unread' : 'mark_email_read'} size="small" />
                      </button>
                      <button
                        className="notification-delete-btn"
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        <MaterialIcon name="close" size="small" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-panel-footer">
              <button
                className="view-settings-btn"
                onClick={() => {
                  navigate('/settings');
                  setIsOpen(false);
                }}
              >
                <MaterialIcon name="settings" size="small" /> Notification Settings
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
