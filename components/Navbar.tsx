"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/supabase/hooks/useAuth";
import type { MenuKey } from "@/lib/auth-types";

interface NavItem {
  key: MenuKey;
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, canAccess } = useAuth();

  // Close menu on route change (deferred to avoid sync setState in effect)
  useEffect(() => {
    Promise.resolve().then(() => setMenuOpen(false));
  }, [pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Track scroll position to change navbar blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const NAV_ITEMS: NavItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" /> */}
        </svg>
      ),
    },
    {
      key: "absensi",
      label: "Absensi",
      href: "/absensi",
      icon: (
        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" /> */}
        </svg>
      ),
    },
    {
      key: "izin",
      label: "Izin",
      href: "/izin",
      icon: (
        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* <path d="M6 7h12M6 11h10M6 15h8" />
          <path d="M4 5h16v14H4z" /> */}
        </svg>
      ),
    },
    {
      key: "pemasukan",
      label: "Pemasukan",
      href: "/pemasukan",
      icon: (
        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" /> */}
        </svg>
      ),
    },
    {
      key:"pengeluaran",
      label: "Pengeluaran",
      href: "/pengeluaran",
      icon: (
        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" /> */}
        </svg>
      ),
    },
    {
      key:"laporan",
      label: "Laporan",
      href: "/laporan",
      icon: (
        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" /> */}
        </svg>
      ),
    },
    {
      key: "manajemen_karyawan",
      label: "Manajemen Karyawan",
      href: "/manajemen",
      icon: (
        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" /> */}
        </svg>
      ),
    },
    {
      key: "manajemen_izin",
      label: "Manajemen Izin",
      href: "/manajemen/izin",
      icon: (
        <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* <path d="M4 7h16M8 11h8M10 15h4" />
          <path d="M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /> */}
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* ── Top Navbar ── */}
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="navbar__container container">
          <Link href="/dashboard" className="navbar__brand">
            {/* <div className="navbar__logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div> */}
            <div className="navbar__title-group">
              <span className="navbar__title">Laundry Coin</span>
              <span className="navbar__subtitle">Premium Finance</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <ul className="navbar__menu">
            {NAV_ITEMS
            .filter((item) => canAccess(item.key))
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`navbar__link ${isActive ? "navbar__link--active" : ""}`}>
                    {item.icon}
                    <span>{item.label}</span>
                    {isActive && <span className="navbar__link-indicator" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          {user && (
            <div className="navbar__profile">
              <div className="navbar__profile-avatar">{user.username?.charAt(0).toUpperCase() ?? user.nama.charAt(0).toUpperCase()}</div>
              <div className="navbar__profile-text">
                <span className="navbar__profile-username">{user.username ?? user.nama}</span>
                <span className="navbar__profile-role">{user.role === "super_admin" ? "Super Admin" : "Admin"}</span>
              </div>
            </div>
          )}

          {/* Burger */}
          <button
            className={`burger ${menuOpen ? "burger--open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="burger__line" />
            <span className="burger__line" />
            <span className="burger__line" />
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer Overlay ── */}
      <div
        className={`drawer-overlay ${menuOpen ? "drawer-overlay--visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* ── Mobile Drawer ── */}
      <aside className={`drawer ${menuOpen ? "drawer--open" : ""}`}>
        <div className="drawer__header">
          <div className="drawer__brand">
            <div className="navbar__logo-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="navbar__title-group">
              <span className="navbar__title">LaundryKas</span>
              <span className="navbar__subtitle">Premium Finance</span>
            </div>
          </div>
          <button className="drawer__close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="drawer__divider" />

        <ul className="drawer__menu">
          {NAV_ITEMS.filter((item) => canAccess(item.key)).map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} style={{ animationDelay: `${idx * 55}ms` }}>
                <Link href={item.href} className={`drawer__link ${isActive ? "drawer__link--active" : ""}`}>
                  <div className="drawer__link-icon-wrap">{item.icon}</div>
                  <span>{item.label}</span>
                  {isActive && <span className="drawer__active-pip" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="drawer__footer">
          <p className="drawer__footer-text">LaundryKas Premium © {new Date().getFullYear()}</p>
        </div>
      </aside>

      {/* ── Bottom Nav (mobile fallback) ── */}
      <nav className="bottomnav">
        {NAV_ITEMS.filter((item) => canAccess(item.key)).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`bottomnav__item ${isActive ? "bottomnav__item--active" : ""}`}>
              <div className={`bottomnav__icon-wrap ${isActive ? "bottomnav__icon-wrap--active" : ""}`}>
                {item.icon}
              </div>
              <span className="bottomnav__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        /* ═══════════════════════════════
           TOP NAVBAR
        ═══════════════════════════════ */
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          height: var(--nav-height);
          display: flex;
          align-items: center;
          background: rgba(9, 13, 22, 0.2);
          backdrop-filter: blur(100px);
          -webkit-backdrop-filter: blur(100px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .navbar--scrolled {
          height: calc(var(--nav-height) - 4px);
          background: rgba(9, 13, 22, 0.75);
          backdrop-filter: blur(100px);
          -webkit-backdrop-filter: blur(100px);
          filter: blur(18px);
          opacity: 0.15;
          border-bottom-color: rgba(99, 102, 241, 0.15);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .navbar__container {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Brand */
        .navbar__brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .navbar__logo-mark {
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
          border-radius: 12px;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .navbar__brand:hover .navbar__logo-mark {
          transform: rotate(15deg) scale(1.05);
        }

        .navbar__title-group {
          display: flex;
          flex-direction: column;
        }

        .navbar__title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.5px;
          line-height: 1.15;
          background: linear-gradient(135deg, #ffffff 40%, #c7d2fe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .navbar__subtitle {
          font-size: 9px;
          color: var(--color-primary-dim);
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 700;
        }

        /* Desktop menu */
        .navbar__menu {
          list-style: none;
          display: flex;
          gap: 6px;
          margin: 0; padding: 0;
        }

        .navbar__link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .navbar__link :global(.nav-icon) {
          transition: transform 0.2s ease;
        }

        .navbar__link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.04);
        }

        .navbar__link:hover :global(.nav-icon) {
          transform: translateY(-1px);
        }

        .navbar__link--active {
          background: rgba(99, 102, 241, 0.12);
          color: #ffffff;
        }

        .navbar__profile {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          margin-left: 1rem;
          white-space: nowrap;
        }

        .navbar__profile-avatar {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.16);
          color: #c4b5fd;
          font-size: 0.95rem;
          font-weight: 800;
        }

        .navbar__profile-text {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .navbar__profile-username {
          font-size: 0.92rem;
          font-weight: 700;
          color: #ffffff;
        }

        .navbar__profile-role {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .navbar__link-indicator {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 3px;
          background: var(--color-primary);
          border-radius: 99px 99px 0 0;
          box-shadow: 0 0 8px var(--color-primary);
        }

        /* Burger */
        .burger {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          width: 40px; height: 40px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          cursor: pointer;
          padding: 0 11px;
          transition: all 0.2s ease;
        }

        .burger:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .burger__line {
          display: block;
          height: 2px;
          background: var(--color-text);
          border-radius: 2px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }

        .burger--open .burger__line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .burger--open .burger__line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .burger--open .burger__line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ═══════════════════════════════
           DRAWER OVERLAY
        ═══════════════════════════════ */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 290;
          background: rgba(3, 7, 18, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .drawer-overlay--visible {
          opacity: 1;
          pointer-events: all;
        }

        /* ═══════════════════════════════
           DRAWER
        ═══════════════════════════════ */
        .drawer {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          z-index: 300;
          width: min(320px, 85vw);
          background: rgba(10, 15, 26, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .drawer--open { transform: translateX(0); }

        .drawer__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.25rem;
        }

        .drawer__brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .drawer__close {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .drawer__close:hover {
          background: rgba(244, 63, 94, 0.1);
          color: var(--color-danger);
          border-color: rgba(244, 63, 94, 0.2);
        }

        .drawer__divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
          margin: 0 1.25rem;
        }

        .drawer__menu {
          list-style: none;
          margin: 1.5rem 0 0;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .drawer__menu li {
          animation: drawerSlideIn 0.4s both;
        }

        @keyframes drawerSlideIn {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .drawer__link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-decoration: none;
          position: relative;
          transition: all 0.2s ease;
        }

        .drawer__link:hover {
          background: rgba(255, 255, 255, 0.04);
          color: #ffffff;
          padding-left: 20px;
        }

        .drawer__link--active {
          background: rgba(99, 102, 241, 0.12);
          color: #ffffff;
          box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.2);
        }

        .drawer__link-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          flex-shrink: 0;
          transition: all 0.2s ease;
          color: var(--color-text-muted);
        }

        .drawer__link--active .drawer__link-icon-wrap {
          background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
          color: white;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
        }

        .drawer__active-pip {
          margin-left: auto;
          width: 6px; height: 6px;
          background: var(--color-primary);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--color-primary);
        }

        .drawer__footer {
          padding: 1.5rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        .drawer__footer-text {
          margin: 0;
          font-size: 0.8rem;
          color: var(--color-text-muted);
          text-align: center;
          font-weight: 500;
        }

        /* ═══════════════════════════════
           BOTTOM NAV (mobile fallback)
        ═══════════════════════════════ */
        .bottomnav {
          display: none;
          position: fixed;
          bottom: 16px; left: 16px; right: 16px;
          z-index: 100;
          height: 64px;
          background: rgba(13, 19, 34, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          justify-content: space-around;
          align-items: center;
          padding: 0 0.5rem;
        }

        .bottomnav__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          flex: 1;
          padding: 6px 4px;
          text-decoration: none;
          color: var(--color-text-muted);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .bottomnav__icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          border-radius: 10px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bottomnav__icon-wrap--active {
          background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
          color: white;
          transform: translateY(-4px);
          box-shadow: 0 6px 15px rgba(99, 102, 241, 0.4);
        }

        .bottomnav__item--active {
          color: #ffffff;
        }

        .bottomnav__label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        /* ═══════════════════════════════
           RESPONSIVE
        ═══════════════════════════════ */
        @media (max-width: 820px) {
          .navbar__menu { display: none; }
          .navbar__profile { display: none; }
          .burger { display: flex; }
        }

        @media (max-width: 480px) {
          .navbar { display: none; }
          .bottomnav { display: flex; }
        }
      `}</style>
    </>
  );
}