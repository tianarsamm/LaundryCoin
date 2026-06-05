"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNotifications, NotifType } from "@/context/NotificationContext";

// ─── Type config ──────────────────────────────────────────────────
const TYPE_CFG: Record<NotifType, { icon: React.ReactElement; color: string; bg: string }> = {
  success: {
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.1)",
  },
  error: {
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>,
    color: "#f87171",
    bg: "rgba(248,113,113,0.1)",
  },
  warning: {
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.1)",
  },
  info: {
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
    color: "#818cf8",
    bg: "rgba(99,102,241,0.1)",
  },
};

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  if (hrs < 24) return `${hrs} jam lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// ─── Bell Icon ────────────────────────────────────────────────────
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Notification Bell + Panel ────────────────────────────────────
export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead, clearAll, removeNotif } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Mark all read when panel opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      const timer = setTimeout(markAllRead, 800);
      return () => clearTimeout(timer);
    }
  }, [open, unreadCount, markAllRead]);

  return (
    <div className="bell-wrap">
      {/* Bell Button */}
      <button
        ref={btnRef}
        className={`bell-btn ${open ? "bell-active" : ""}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Notifikasi"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {/* Pulse ring when new notifs */}
        {unreadCount > 0 && <span className="bell-pulse" />}
      </button>

      {/* Panel */}
      {open && (
        <div ref={panelRef} className="panel">
          {/* Panel Header */}
          <div className="panel-head">
            <div className="panel-title">
              <span>Notifikasi</span>
              {unreadCount > 0 && (
                <span className="unread-pill">{unreadCount} baru</span>
              )}
            </div>
            {notifications.length > 0 && (
              <button className="clear-btn" onClick={clearAll}>
                Hapus semua
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="panel-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p>Tidak ada notifikasi</p>
                <span>Notifikasi baru akan muncul di sini</span>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CFG[n.type];
                return (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.read ? "notif-unread" : ""}`}
                    onClick={() => markRead(n.id)}
                  >
                    {/* Unread dot */}
                    {!n.read && <span className="unread-dot" style={{ background: cfg.color }} />}

                    {/* Type icon */}
                    <div className="notif-icon" style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="notif-content">
                      <p className="notif-title">{n.title}</p>
                      <p className="notif-body">{n.body}</p>
                      <span className="notif-time">{formatRelativeTime(n.timestamp)}</span>
                    </div>

                    {/* Remove */}
                    <button
                      className="notif-remove"
                      onClick={e => { e.stopPropagation(); removeNotif(n.id); }}
                      aria-label="Hapus"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .bell-wrap {
          position: relative;
          flex-shrink: 0;
        }

        /* Bell Button */
        .bell-btn {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(51, 65, 85, 0.7);
          background: rgba(15, 23, 42, 0.8);
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .bell-btn:hover {
          color: #e2e8f0;
          border-color: rgba(99, 102, 241, 0.4);
          background: rgba(99, 102, 241, 0.08);
        }
        .bell-active {
          color: #a5b4fc;
          border-color: rgba(99, 102, 241, 0.5);
          background: rgba(99, 102, 241, 0.12);
        }

        /* Badge */
        .badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: #6366f1;
          border: 2px solid #030712;
          border-radius: 100px;
          font-size: 0.6rem;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: badgeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes badgeIn {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }

        /* Pulse ring */
        .bell-pulse {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.4);
          animation: bellPulse 2s ease-out infinite;
        }
        @keyframes bellPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0;   }
        }

        /* Panel */
        .panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 360px;
          max-width: calc(100vw - 1rem);
          background: rgba(8, 12, 24, 0.98);
          border: 1px solid rgba(51, 65, 85, 0.7);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          z-index: 9998;
          overflow: hidden;
          animation: panelIn 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        /* Panel header */
        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(30, 41, 59, 0.8);
        }
        .panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 800;
          color: #e2e8f0;
        }
        .unread-pill {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.25);
          padding: 1px 7px;
          border-radius: 100px;
          font-size: 0.65rem;
          font-weight: 700;
        }
        .clear-btn {
          background: none;
          border: none;
          color: #334155;
          font-size: 0.72rem;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 5px;
          transition: color 0.15s;
          font-weight: 600;
        }
        .clear-btn:hover { color: #64748b; }

        /* Scrollable list */
        .panel-list {
          max-height: 380px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(51, 65, 85, 0.5) transparent;
        }
        .panel-list::-webkit-scrollbar { width: 4px; }
        .panel-list::-webkit-scrollbar-track { background: transparent; }
        .panel-list::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.5); border-radius: 4px; }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 2.5rem 1rem;
          color: #334155;
          text-align: center;
        }
        .empty-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(51, 65, 85, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .empty-state p {
          font-size: 0.82rem;
          font-weight: 700;
          color: #475569;
          margin: 0;
        }
        .empty-state span {
          font-size: 0.72rem;
          color: #1e293b;
        }

        /* Notif item */
        .notif-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.8);
          cursor: pointer;
          transition: background 0.15s;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: rgba(99, 102, 241, 0.04); }
        .notif-unread { background: rgba(99, 102, 241, 0.03); }

        .unread-dot {
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .notif-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .notif-content {
          flex: 1;
          min-width: 0;
        }
        .notif-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0 0 3px;
          line-height: 1.3;
        }
        .notif-body {
          font-size: 0.72rem;
          color: #64748b;
          margin: 0 0 5px;
          line-height: 1.4;
        }
        .notif-time {
          font-size: 0.65rem;
          color: #334155;
          font-weight: 600;
        }

        .notif-remove {
          background: none;
          border: none;
          color: #1e293b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.15s;
          opacity: 0;
        }
        .notif-item:hover .notif-remove { opacity: 1; }
        .notif-remove:hover { color: #64748b; }

        @media (max-width: 480px) {
          .panel {
            right: -38px; /* align past bell on mobile */
            width: calc(100vw - 1.5rem);
            max-width: 340px;
          }
        }
      `}</style>
    </div>
  );
}