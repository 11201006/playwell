import React, { useState, useEffect } from "react";
import api from "../utils/api";
import LoadingScreen from "../components/LoadingScreen";
import ResultScreen from "../components/ResultScreen";

export default function VisualSearch() {
  const [rounds, setRounds] = useState(5);
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState("idle");
  const [startAt, setStartAt] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [targetIdx, setTargetIdx] = useState(null);

  const start = () => {
    setReactionTimes([]);
    setCurrent(0);
    setSubmitted(false);
    setResult(null);
    nextRound();
    setStatus("playing");
  };

  const nextRound = () => {
    const target = Math.floor(Math.random() * 9);
    setTargetIdx(target);
    setStartAt(Date.now());
  };

  const handleClick = (idx) => {
    if (status !== "playing") return;
    const rt = Date.now() - startAt;
    setReactionTimes((prev) => [...prev, rt]);
    if (current + 1 >= rounds) submitSession();
    else {
      setCurrent((c) => c + 1);
      nextRound();
    }
  };

  const submitSession = async () => {
    if (submitted) return;
    setSubmitted(true);
    setStatus("loading");
    const avg = reactionTimes.length ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : null;

    try {
      const res = await api.post("/game/submit", {
        userId: localStorage.getItem("user_id"),
        gameType: "Visual Search",
        reaction_avg: avg,
        memory_score: null,
        durationMs: rounds * 1500,
        meta: { reactionTimes },
      });

      const recommendations = Array.isArray(res.data.recommendations)
        ? res.data.recommendations
        : [res.data.recommendations || ""];

      setResult({
        stress_level: res.data.stress_level,
        cognitive_score: res.data.cognitive_score ?? res.data.focus_score ?? avg,
        recommendations,
      });

      setStatus("result");
    } catch (err) {
      console.error(err);
      setResult({ stress_level: "unknown", cognitive_score: null, recommendations: ["Submit failed"] });
      setStatus("result");
    }
  };

  const onRetry = () => start();

  return (
    <div className="pt-24 px-6 min-h-screen text-center">
      <h2 className="text-2xl font-semibold text-teal-700 mb-4">Visual Search</h2>

      {status === "idle" && (
        <div>
          <p className="mb-2">Rounds: {rounds}</p>
          <input type="range" min={3} max={10} value={rounds} onChange={(e) => setRounds(Number(e.target.value))} />
          <div className="mt-4">
            <button onClick={start} className="bg-teal-500 text-white px-4 py-2 rounded">Start</button>
          </div>
        </div>
      )}

      {status === "playing" && (
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className={`w-16 h-16 rounded border cursor-pointer ${idx === targetIdx ? "bg-red-400" : "bg-gray-200"}`}
              onClick={() => handleClick(idx)}
            />
          ))}
        </div>
      )}

      {status === "loading" && <LoadingScreen message="Submitting..." />}
      {status === "result" && <ResultScreen result={result} onRetry={onRetry} onClose={() => setStatus("idle")} />}
    </div>
  );
}
