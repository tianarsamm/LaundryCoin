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
  title: "Laundry Coin — Sistem Laundry",
  description: "Sistem Manajemen Usaha Laundry",
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
        <ServiceWorkerRegister />  {/* ← tambah ini */}
        <Navbar />
        <main className="layout__main">
          {children}
        </main>
      </body>
    </html>
  );
}