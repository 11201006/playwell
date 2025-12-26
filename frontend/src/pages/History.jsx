import { useEffect, useState } from "react";
import api from "../utils/api";

export default function History() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("pw_token");

    if (!userId || !token) {
      setError("You must be logged in to view history");
      return;
    }

    api
      .get(`/user/history/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data || [];
        const sorted = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setRows(sorted);
      })
      .catch(() => setError("Failed to fetch history. Please try again."));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-12 bg-gradient-to-b from-blue-50 to-teal-50">
      <h2 className="text-3xl font-semibold text-teal-700 mb-6 text-center">
        Session History
      </h2>

      <div className="space-y-4 max-w-3xl mx-auto">
        {rows.map((r, i) => {
          const focus =
          typeof r.focus_score === "number"
          ? r.focus_score
          : typeof r.cognitive_score === "number"
          ? r.cognitive_score
          : null;
          
          let recList = r.recommendations;
          try {
            if (typeof recList === "string") {
              recList = JSON.parse(recList);
            }
          } catch {}
          if (Array.isArray(recList)) recList = recList.join(", ");
          
          return (
          <div key={i} className="bg-white p-5 rounded-2xl shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">
                  Game: {r.game_type}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div>
                  Stress: <b className="capitalize">{r.stress_level || "-"}</b>
                </div>
                <div>
                  Focus: {focus !== null ? <b>{focus.toFixed(2)}</b> : "-"}
                </div>
              </div>
            </div>
            
            {recList && (
              <p className="mt-3 text-sm text-gray-600">
                {recList}
              </p>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
