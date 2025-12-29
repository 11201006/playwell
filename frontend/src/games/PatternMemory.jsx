// src/games/PatternMemory.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import LoadingScreen from "../components/LoadingScreen";
import ResultScreen from "../components/ResultScreen";

export default function PatternMemory() {
  const [grid, setGrid] = useState([]);
  const [userGrid, setUserGrid] = useState([]);
  const [status, setStatus] = useState("idle");
  const [rounds, setRounds] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const isGuest = !localStorage.getItem("access_token");

  const size = 4;

  const start = () => {
    const newGrid = Array.from({ length: size * size }, () =>
      Math.random() > 0.7 ? 1 : 0
    );
    setGrid(newGrid);
    setUserGrid(Array(newGrid.length).fill(0));
    setSubmitted(false);
    setResult(null);
    setStatus("showing");
  };

  const handleClick = (idx) => {
    if (status !== "input") return;
    const next = [...userGrid];
    next[idx] = next[idx] ? 0 : 1;
    setUserGrid(next);
  };

  const submitSession = async () => {
  if (submitted) return;
  setSubmitted(true);
  setStatus("loading");

  const correct = grid.reduce(
    (acc, val, idx) => acc + (val === userGrid[idx] ? 1 : 0),
    0
  );

  const score = Math.round((correct / grid.length) * 100);

  try {
    let res;

    if (isGuest) {
      res = await api.post("/game/predict", {
        reaction_avg: null,
        memory_score: score,
      });
    } else {
      res = await api.post("/game/submit", {
        gameType: "Pattern Memory",
        reaction_avg: null,
        memory_score: score,
        durationMs: 1000 * grid.length,
        meta: { grid, userGrid },
      });
    }

    const recommendations = Array.isArray(res.data.recommendations)
      ? res.data.recommendations
      : [res.data.recommendations || ""];

    setResult({
      stress_level: res.data.stress_level,
      cognitive_score:
        res.data.cognitive_score ??
        res.data.focus_score ??
        score,
      recommendations,
    });

    setStatus("result");
  } catch (err) {
    console.error(err);
    setResult({
      stress_level: "unknown",
      cognitive_score: null,
      recommendations: ["Submit failed"],
    });
    setStatus("result");
  }
};

  useEffect(() => {
    if (status === "showing") {
      const timer = setTimeout(() => setStatus("input"), 2000 + rounds * 500);
      return () => clearTimeout(timer);
    }
  }, [status, rounds]);

  const onRetry = () => start();

  return (
    <div className="pt-24 px-6 min-h-screen text-center">
      <h2 className="text-2xl font-semibold text-teal-700 mb-4">Pattern Memory</h2>

      {status === "idle" && (
        <div>
          <p className="mb-2">Rounds: {rounds}</p>
          <input
            type="range"
            min={2}
            max={6}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
          />
          <div className="mt-4">
            <button
              onClick={start}
              className="bg-teal-500 text-white px-4 py-2 rounded"
            >
              Start
            </button>
          </div>
        </div>
      )}

      {status === "showing" && (
        <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
          {grid.map((cell, idx) => (
            <div
              key={idx}
              className={`w-16 h-16 rounded ${cell ? "bg-blue-400" : "bg-gray-200"}`}
            />
          ))}
        </div>
      )}

      {status === "input" && (
        <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
          {grid.map((_, idx) => (
            <div
              key={idx}
              className={`w-16 h-16 rounded cursor-pointer ${
                userGrid[idx] ? "bg-blue-400" : "bg-gray-200"
              }`}
              onClick={() => handleClick(idx)}
            />
          ))}
          <button
            onClick={submitSession}
            className="mt-4 bg-teal-500 text-white px-4 py-2 rounded col-span-4"
          >
            Submit
          </button>
        </div>
      )}

      {status === "loading" && <LoadingScreen message="Submitting..." />}
      {status === "result" && (
        <ResultScreen result={result} onRetry={onRetry} onClose={() => setStatus("idle")} />
      )}
    </div>
  );
}
