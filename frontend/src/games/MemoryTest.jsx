// src/games/MemoryTest.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import LoadingScreen from "../components/LoadingScreen";
import ResultScreen from "../components/ResultScreen";

export default function MemoryTest() {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [status, setStatus] = useState("idle");
  const [rounds, setRounds] = useState(4);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const colors = ["red", "green", "blue", "yellow", "purple", "orange"];

  const isGuest = new URLSearchParams(window.location.search).get("guest") === "true";

  const start = () => {
    setSequence([]);
    setUserSequence([]);
    setSubmitted(false);
    setResult(null);
    setCurrentIndex(-1);
    generateSequence();
    setStatus("showing");
  };

  const generateSequence = () => {
    const seq = Array.from({ length: rounds }, () =>
      colors[Math.floor(Math.random() * colors.length)]
    );
    setSequence(seq);
  };

  const handleClick = (color) => {
    if (status !== "input") return;
    const next = [...userSequence, color];
    setUserSequence(next);
    if (next.length >= sequence.length) {
      submitSession(next);
    }
  };

  const submitSession = async (userSeq) => {
  if (submitted) return;
  setSubmitted(true);
  setStatus("loading");

  const score = userSeq.filter((c, i) => c === sequence[i]).length;
  const memoryScore = score * 20;

  try {
    let res;

    if (isGuest) {
      res = await api.post("/game/predict", {
        reaction_avg: null,
        memory_score: memoryScore,
      });
    } else {
      res = await api.post("/game/submit", {
        gameType: "Memory Test",
        reaction_avg: null,
        memory_score: memoryScore,
        durationMs: 1000 * sequence.length,
        meta: { sequence, userSeq },
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
        memoryScore,
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
    if (status === "showing" && sequence.length > 0) {
      setCurrentIndex(-1);
      let idx = 0;
      const interval = setInterval(() => {
        if (idx >= sequence.length) {
          clearInterval(interval);
          setCurrentIndex(-1);
          setTimeout(() => setStatus("input"), 500);
        } else {
          setCurrentIndex(idx);
          idx++;
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [status, sequence]);

  const onRetry = () => start();

  return (
    <div className="pt-24 px-6 min-h-screen text-center">
      <h2 className="text-2xl font-semibold text-teal-700 mb-4">Memory Test</h2>

      {status === "idle" && (
        <div>
          <p className="mb-2">Rounds: {rounds}</p>
          <input
            type="range"
            min={2}
            max={8}
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
        <div className="flex justify-center gap-4">
          {sequence.map((c, i) => (
            <div
            key={i}
            className={`w-20 h-20 rounded-xl border-4 border-gray-300 shadow-md flex items-center justify-center transition-colors duration-300 ${
              i === currentIndex
              ? c === "red"
              ? "bg-red-600"
              : c === "green"
              ? "bg-green-600"
              : c === "blue"
              ? "bg-blue-600"
              : c === "yellow"
              ? "bg-yellow-400"
              : c === "purple"
              ? "bg-purple-600"
              : "bg-orange-500"
              : "bg-gray-200"
            }`}
            ></div>
          ))}
        </div>
      )}

{status === "input" && (
  <div className="flex justify-center gap-4 flex-wrap mt-4">
    {colors.map((c) => (
      <button
        key={c}
        className={`w-20 h-20 rounded-xl border-2 border-gray-400 shadow-lg transition transform hover:scale-105 ${
          c === "red"
            ? "bg-red-600"
            : c === "green"
            ? "bg-green-600"
            : c === "blue"
            ? "bg-blue-600"
            : c === "yellow"
            ? "bg-yellow-400"
            : c === "purple"
            ? "bg-purple-600"
            : "bg-orange-500"
        }`}
        onClick={() => handleClick(c)}
      ></button>
    ))}
  </div>
)}

      {status === "loading" && <LoadingScreen message="Submitting..." />}
      {status === "result" && (
        <ResultScreen
          result={result}
          onRetry={onRetry}
          onClose={() => setStatus("idle")}
        />
      )}
    </div>
  );
}
