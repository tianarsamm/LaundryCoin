"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TransaksiChartProps {
  labels: string[];
  pemasukan: number[];
  pengeluaran: number[];
}

export default function TransaksiChart({ labels, pemasukan, pengeluaran }: TransaksiChartProps) {
  const { theme } = useTheme();

  // Warna adaptif berdasarkan tema
  const isDark = theme === "dark";

  const tickColor      = isDark ? "#64748b" : "#94a3b8";
  const gridColor      = isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.06)";
  const legendColor    = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg      = isDark ? "#0d1322" : "#ffffff";
  const tooltipTitle   = isDark ? "#f8fafc" : "#0f172a";
  const tooltipBody    = isDark ? "#94a3b8" : "#64748b";
  const tooltipBorder  = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";

  const data = {
    labels,
    datasets: [
      {
        label: "Pemasukan",
        data: pemasukan,
        backgroundColor: "rgba(99, 102, 241, 0.85)",
        hoverBackgroundColor: "rgba(99, 102, 241, 1)",
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.75,
      },
      {
        label: "Pengeluaran",
        data: pengeluaran,
        backgroundColor: "rgba(244, 63, 94, 0.75)",
        hoverBackgroundColor: "rgba(244, 63, 94, 0.95)",
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.75,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: legendColor,
          font: { family: "DM Sans, sans-serif", size: 12, weight: 600 },
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
          usePointStyle: true,
          pointStyle: "circle" as const,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTitle,
        titleFont: { family: "Sora, sans-serif", size: 12, weight: 700 },
        bodyColor: tooltipBody,
        bodyFont: { family: "DM Sans, sans-serif", size: 12 },
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 4,
        callbacks: {
          label: (ctx: any) => `  Rp ${ctx.parsed.y.toLocaleString("id-ID")}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: tickColor,
          font: { family: "DM Sans, sans-serif", size: 11, weight: 500 },
        },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        ticks: {
          color: tickColor,
          font: { family: "DM Sans, sans-serif", size: 11, weight: 500 },
          callback: (v: any) => `Rp ${(v / 1000).toFixed(0)}k`,
          padding: 8,
        },
        grid: { color: gridColor },
        border: { display: false },
      },
    },
  };

  return (
    <div className="transaksi-chart-wrapper">
      {/* key={theme} forces chart re-render when theme changes */}
      <Bar key={theme} data={data} options={options} />
      <style jsx>{`
        .transaksi-chart-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 280px;
        }
      `}</style>
    </div>
  );
}