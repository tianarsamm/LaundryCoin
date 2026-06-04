'use client';

import { useEffect, useState } from 'react';

interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// Close icon SVG
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function NotificationToast() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  useEffect(() => {
    // Listen untuk custom notification event dari NotificationProvider
    const handleNotification = (event: CustomEvent<NotificationMessage>) => {
      const notification = {
        ...event.detail,
        id: Date.now().toString(),
      };
      
      setNotifications((prev) => [notification, ...prev]);

      // Auto remove setelah 5 detik
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);
    };

    window.addEventListener(
      'notification:received',
      handleNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        'notification:received',
        handleNotification as EventListener
      );
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            animate-in fade-in slide-in-from-right-full duration-300
            rounded-lg p-4 shadow-lg border-l-4
            ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-500 text-green-900'
                : notification.type === 'error'
                  ? 'bg-red-50 border-red-500 text-red-900'
                  : notification.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-500 text-yellow-900'
                    : 'bg-blue-50 border-blue-500 text-blue-900'
            }
          `}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold">{notification.title}</h3>
              <p className="text-sm mt-1">{notification.body}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {notification.timestamp.toLocaleTimeString('id-ID')}
              </span>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
              aria-label="Close notification"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
