import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister"; // ← tambah ini
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
  title: "LaundryKas — Sistem Keuangan Laundry",
  description: "Aplikasi pencatatan keuangan usaha laundry",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="layout">
        <ServiceWorkerRegister />  {/* ← tambah ini */}
        <Navbar />
        <main className="layout__main">
          {children}
        </main>
      </body>
    </html>
  );
}