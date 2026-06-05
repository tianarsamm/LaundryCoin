"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useNotifications, NotifType } from "@/context/NotificationContext";

// ─── Config ───────────────────────────────────────────────────────
const TOAST_DURATION = 4500; // ms
const MAX_VISIBLE = 3;

interface ToastItem {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  exiting: boolean;
}

// ─── Icons ────────────────────────────────────────────────────────
const ICONS: Record<NotifType, JSX.Element> = {
  success: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const TYPE_STYLE: Record<NotifType, { iconColor: string; iconBg: string; progressColor: string; border: string }> = {
  success: {
    iconColor: "#4ade80",
    iconBg: "rgba(74,222,128,0.12)",
    progressColor: "#4ade80",
    border: "rgba(74,222,128,0.2)",
  },
  error: {
    iconColor: "#f87171",
    iconBg: "rgba(248,113,113,0.12)",
    progressColor: "#f87171",
    border: "rgba(248,113,113,0.2)",
  },
  warning: {
    iconColor: "#fbbf24",
    iconBg: "rgba(251,191,36,0.12)",
    progressColor: "#fbbf24",
    border: "rgba(251,191,36,0.2)",
  },
  info: {
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.12)",
    progressColor: "#6366f1",
    border: "rgba(99,102,241,0.25)",
  },
};

// ─── Single Toast ─────────────────────────────────────────────────
function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const st = TYPE_STYLE[item.type];
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={`toast-item ${item.exiting ? "toast-exit" : "toast-enter"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ "--border-color": st.border, "--progress-color": st.progressColor } as React.CSSProperties}
    >
      {/* Left accent line */}
      <div className="toast-accent" style={{ background: st.progressColor }} />

      {/* Icon */}
      <div className="toast-icon" style={{ color: st.iconColor, background: st.iconBg }}>
        {ICONS[item.type]}
      </div>

      {/* Content */}
      <div className="toast-content">
        <p className="toast-title">{item.title}</p>
        <p className="toast-body">{item.body}</p>
      </div>

      {/* Dismiss */}
      <button className="toast-close" onClick={() => onDismiss(item.id)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        className={`toast-progress ${paused ? "toast-progress-paused" : ""}`}
        style={{ "--duration": `${TOAST_DURATION}ms`, background: st.progressColor } as React.CSSProperties}
      />

      <style jsx>{`
        .toast-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px 14px 16px;
          background: rgba(10, 15, 30, 0.97);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          width: 340px;
          max-width: calc(100vw - 2rem);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          backdrop-filter: blur(12px);
        }
        .toast-enter {
          animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .toast-exit {
          animation: toastOut 0.25s ease-in forwards;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0)    scale(1);   max-height: 120px; margin-bottom: 8px; }
          to   { opacity: 0; transform: translateX(110%) scale(0.9); max-height: 0;     margin-bottom: 0;  }
        }
        .toast-accent {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          border-radius: 12px 0 0 12px;
        }
        .toast-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .toast-content {
          flex: 1;
          min-width: 0;
        }
        .toast-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0 0 3px;
          line-height: 1.3;
        }
        .toast-body {
          font-size: 0.76rem;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }
        .toast-close {
          background: none;
          border: none;
          color: #334155;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .toast-close:hover { color: #94a3b8; }
        .toast-progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          border-radius: 0 0 12px 12px;
          animation: progress var(--duration) linear forwards;
          opacity: 0.6;
        }
        .toast-progress-paused { animation-play-state: paused; }
        @keyframes progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────
export function ToastContainer() {
  const { notifications } = useNotifications();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenIds = useRef(new Set<string>());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timers.current.delete(id);
    }, 280);
    timers.current.set(`exit-${id}`, timer);
  }, []);

  // Watch for new notifications and turn them into toasts
  useEffect(() => {
    notifications.forEach(n => {
      if (seenIds.current.has(n.id)) return;
      seenIds.current.add(n.id);

      const toast: ToastItem = { id: n.id, title: n.title, body: n.body, type: n.type, exiting: false };
      setToasts(prev => [toast, ...prev].slice(0, MAX_VISIBLE));

      // Auto dismiss
      const timer = setTimeout(() => dismiss(n.id), TOAST_DURATION);
      timers.current.set(n.id, timer);
    });
  }, [notifications, dismiss]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      timers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <>
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 72px; /* below navbar */
          right: 1rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
        }
        .toast-container > :global(*) {
          pointer-events: auto;
        }
        @media (max-width: 640px) {
          .toast-container {
            top: 64px;
            right: 0.75rem;
            left: 0.75rem;
          }
          .toast-container > :global(.toast-item) {
            width: 100%;
            max-width: 100%;
          }
        }
      `}</style>
    </>
  );
}