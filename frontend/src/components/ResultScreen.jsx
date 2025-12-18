// src/components/ResultScreen.jsx
import React from "react";
import { getRecommendations } from "../utils/recommendations";

export default function ResultScreen({ result, onRetry, onClose, onPlayOther }) {
  if (!result) return null;

  const { cognitive_score, stress_level } = result;
  const recommendations = getRecommendations({ stress_level, cognitive_score });

  // Stress color scheme
  const stressColor =
    stress_level === "high"
      ? "bg-red-100 text-red-700"
      : stress_level === "medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Results</h2>
        <p className="text-sm text-gray-500 mt-1">Based on your gameplay performance</p>
      </div>

      {/* Score Cards Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <ScoreCard label="Stress Level" value={stress_level?.toUpperCase() || "UNKNOWN"} colorClass={stressColor} />
        <ScoreCard label="Focus Score" value={cognitive_score} />
      </div>

      {/* Recommendations */}
      <div className="mt-4">
        <h4 className="font-semibold text-teal-700 text-lg">Recommendations</h4>
        <div className="mt-3 bg-gray-50 p-4 rounded-xl">
          {recommendations.length > 0 ? (
            <ul className="list-disc ml-6 space-y-1 text-gray-700">
              {recommendations.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">
              No recommendations generated — keep practicing!
            </p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
        >
          Close
        </button>

        <button
          onClick={onRetry}
          className="px-4 py-2 rounded bg-teal-500 text-white hover:bg-teal-600"
        >
          Retry Game
        </button>

        {onPlayOther && (
          <button
            onClick={onPlayOther}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            Play Other Game
          </button>
        )}
      </div>
    </div>
  );
}

// --- Reusable Score Card ---
function ScoreCard({ label, value, colorClass }) {
  return (
    <div className={`p-4 rounded-xl text-center ${colorClass || "bg-gray-50"}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-800">
        {typeof value === "number" ? value : value}
      </div>
    </div>
  );
}
