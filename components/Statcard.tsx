"use client";

import type { ReactNode } from "react";

// ============================================================
// components/StatCard.tsx — Kartu ringkasan keuangan premium
// ============================================================

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  variant?: "default" | "success" | "danger" | "warning";
  sublabel?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  variant = "default",
  sublabel,
}: StatCardProps) {
  return (
    <>
      <div className={`statcard statcard--${variant}`}>
        <div className="statcard__icon-wrap">
          <span className="statcard__icon">{icon}</span>
          <span className="statcard__icon-glow" />
        </div>
        <div className="statcard__body">
          <span className="statcard__label">{label}</span>
          <span className="statcard__value">{value}</span>
          {sublabel && (
            <span className="statcard__sublabel">
              <span className="statcard__sublabel-dot" />
              {sublabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Styles ─────────────────────────────────────────── */}
      <style jsx>{`
        .statcard {
          position: relative;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: var(--color-surface);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .statcard::before {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 4px; height: 100%;
          background: transparent;
          transition: all 0.3s ease;
        }

        .statcard:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 35px rgba(0, 0, 0, 0.4), 0 0 15px rgba(99, 102, 241, 0.05);
        }

        .statcard--success::before {
          background: var(--color-success);
        }
        .statcard--danger::before {
          background: var(--color-danger);
        }
        .statcard--warning::before {
          background: var(--color-warning);
        }
        .statcard--default::before {
          background: var(--color-primary);
        }

        .statcard--success:hover {
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 20px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.1);
        }

        .statcard--danger:hover {
          border-color: rgba(244, 63, 94, 0.3);
          box-shadow: 0 20px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(244, 63, 94, 0.1);
        }

        .statcard--warning:hover {
          border-color: rgba(245, 158, 11, 0.3);
          box-shadow: 0 20px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(245, 158, 11, 0.1);
        }

        /* Icon styling with glow */
        .statcard__icon-wrap {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: var(--radius);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .statcard__icon-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          filter: blur(8px);
          transition: opacity 0.3s ease;
          z-index: 1;
        }

        .statcard:hover .statcard__icon-glow {
          opacity: 0.15;
        }

        .statcard--success .statcard__icon-glow { background: var(--color-success); }
        .statcard--danger .statcard__icon-glow { background: var(--color-danger); }
        .statcard--warning .statcard__icon-glow { background: var(--color-warning); }
        .statcard--default .statcard__icon-glow { background: var(--color-primary); }

        .statcard:hover .statcard__icon-wrap {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .statcard__icon {
          font-size: 24px;
          line-height: 1;
          z-index: 2;
        }

        .statcard__body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .statcard__label {
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .statcard__value {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .statcard--success .statcard__value {
          background: linear-gradient(135deg, #ffffff, var(--color-success));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .statcard--danger .statcard__value {
          background: linear-gradient(135deg, #ffffff, var(--color-danger));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .statcard--warning .statcard__value {
          background: linear-gradient(135deg, #ffffff, var(--color-warning));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .statcard--default .statcard__value {
          background: linear-gradient(135deg, #ffffff, var(--color-primary-dim));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .statcard__sublabel {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-muted);
        }

        .statcard__sublabel-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--color-text-muted);
        }

        .statcard--success .statcard__sublabel-dot { background: var(--color-success); }
        .statcard--danger .statcard__sublabel-dot { background: var(--color-danger); }
        .statcard--warning .statcard__sublabel-dot { background: var(--color-warning); }

        @media (max-width: 480px) {
          .statcard {
            padding: 18px;
            gap: 14px;
          }
          .statcard__value {
            font-size: 20px;
          }
          .statcard__icon-wrap {
            width: 46px;
            height: 46px;
          }
          .statcard__icon {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}