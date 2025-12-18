import React, { useEffect, useState } from "react";
import api from "../utils/api";
import ChartStress from "../components/ChartStress";

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    api.get(`/user/profile/${userId}`).then((res) => {
      setUser(res.data || null);
    });
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return console.error("❌ user_id tidak ditemukan");

    api
      .get(`/user/history/${userId}`)
      .then((res) => {
        const data = res.data || [];
        setHistory(data);

        const labelData = data
          .map((h) => h.created_at || h.date)
          .reverse();

        const valueData = data
          .map((h) => Number(h.focus_score ?? h.cognitive_score ?? 0))
          .reverse();

        setLabels(labelData);
        setValues(valueData);
      })
      .catch((err) => console.error("Error fetching history:", err));
  }, []);

  const last = history[0] || {};
  const lastStress = last.stress_level || "-";
  const lastFocus = last.focus_score ?? last.cognitive_score ?? "-";

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-blue-100 py-10 px-6 flex flex-col items-center">
      
      {/* ================= USER GREETING ================= */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center text-2xl font-semibold shadow-md">
          {user ? user.name?.charAt(0) : "U"}
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-indigo-700">
            Halo, {user ? user.name : "User"} 👋
          </h1>
          <p className="text-gray-600">
            Berikut perkembangan kesehatan mental & kognitifmu
          </p>
        </div>
      </div>

      {/* ================== STATS CARDS ================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-10">
        
        {/* Stress Card */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-red-400">
          <h3 className="text-gray-600">Stress Level Terakhir</h3>
          <p className="text-3xl font-bold capitalize text-red-500">
            {lastStress}
          </p>
        </div>

        {/* Focus Card */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-blue-400">
          <h3 className="text-gray-600">Focus Score Terakhir</h3>
          <p className="text-3xl font-bold text-blue-600">
            {lastFocus !== "-" ? Number(lastFocus).toFixed(2) : "-"}
          </p>
        </div>

        {/* Total Sessions */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-green-400">
          <h3 className="text-gray-600">Total Sesi Analisis</h3>
          <p className="text-3xl font-bold text-green-600">{history.length}</p>
        </div>

      </div>

      {/* =============== LINE CHART =============== */}
      <div className="w-full max-w-5xl mb-8">
        {labels.length === 0 ? (
          <p className="text-gray-600 text-center">
            Belum ada data analisis
          </p>
        ) : (
          <ChartStress labels={labels} values={values} />
        )}
      </div>

      {/* =================== HISTORY TABLE =================== */}
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-5xl">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
          Riwayat Analisis
        </h2>

        <table className="w-full border border-gray-200 text-sm text-gray-700 rounded-xl overflow-hidden">
          <thead className="bg-indigo-100">
            <tr>
              <th className="p-3 border">Tanggal</th>
              <th className="p-3 border">Game</th>
              <th className="p-3 border">Stres</th>
              <th className="p-3 border">Fokus</th>
              <th className="p-3 border">Rekomendasi</th>
            </tr>
          </thead>

          <tbody>
            {history.map((h, i) => {
              const focus = h.focus_score ?? h.cognitive_score;
              let recList = h.recommendations;

              try {
                if (typeof recList === "string") recList = JSON.parse(recList);
              } catch {}

              if (Array.isArray(recList)) recList = recList.join(", ");

              return (
                <tr key={i} className="hover:bg-indigo-50 transition">
                  <td className="p-3 border">
                    {new Date(h.created_at || h.date).toLocaleString()}
                  </td>
                  <td className="p-3 border capitalize">
                    {h.game_type}
                  </td>
                  <td className="p-3 border capitalize">
                    {h.stress_level}
                  </td>
                  <td className="p-3 border">
                    {focus != null ? Number(focus).toFixed(2) : "-"}
                  </td>
                  <td className="p-3 border break-words">
                    {recList || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
