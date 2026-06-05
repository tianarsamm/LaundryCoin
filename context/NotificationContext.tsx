"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────
export type NotifType = "success" | "error" | "warning" | "info";

export interface InAppNotif {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  timestamp: Date;
  read: boolean;
}

interface NotifContextValue {
  notifications: InAppNotif[];
  unreadCount: number;
  addNotification: (title: string, body: string, type?: NotifType) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  removeNotif: (id: string) => void;
}

const NotifContext = createContext<NotifContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<InAppNotif[]>([]);
  const idRef = useRef(0);

  const addNotification = useCallback((title: string, body: string, type: NotifType = "info") => {
    const id = `notif-${++idRef.current}-${Date.now()}`;
    const notif: InAppNotif = { id, title, body, type, timestamp: new Date(), read: false };
    setNotifications(prev => [notif, ...prev].slice(0, 50)); // keep max 50
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const removeNotif = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotifContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, clearAll, removeNotif }}>
      {children}
    </NotifContext.Provider>
  );
}