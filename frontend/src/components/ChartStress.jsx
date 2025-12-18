import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

export default function ChartStress({
  labels = [],
  values = [],
  title = "Grafik Prediksi",
  color = "#60a5fa",
  tension = 0.3,
  invertY = false,
}) {
  if (!values || values.length === 0) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-md text-center text-slate-500">
        Belum ada data untuk ditampilkan
      </div>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        borderColor: color,
        backgroundColor: `${color}33`,
        tension,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: { color: "#1e293b" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        reverse: invertY,
        ticks: { color: "#334155" },
      },
      x: {
        ticks: { color: "#334155" },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-md">
      <Line data={data} options={options} />
    </div>
  );
}
