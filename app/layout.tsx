import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { NotificationProvider } from "@/context/NotificationContext";
import { ToastContainer } from "@/components/ToastContainer";
import NotificationSetup from "@/components/NotificationSetup";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Laundry Coin — Sistem Laundry",
  description: "Sistem Manajemen Usaha Laundry",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Laundry Coin",
  },
  icons: {
    icon: "/logo/Laundry2.png",
    shortcut: "/logo/Laundry2.png",
    apple: "/logo/Laundry2.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="layout">
        <ServiceWorkerRegister />
        <NotificationSetup />
        <NotificationProvider>
          {/* Toast in-app — muncul di pojok kanan bawah navbar, tidak blocking */}
          <ToastContainer />
          <Navbar />
          <main className="layout__main">
            {children}
          </main>
        </NotificationProvider>
      </body>
    </html>
  );
}