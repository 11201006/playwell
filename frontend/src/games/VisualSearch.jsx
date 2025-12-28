import React, { useState, useRef } from "react";
import api from "../utils/api";
import LoadingScreen from "../components/LoadingScreen";
import ResultScreen from "../components/ResultScreen";

const MOTOR_LATENCY_BUFFER = 120;

export default function VisualSearch() {
  const [rounds, setRounds] = useState(5);
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState("idle");

  const [reactionTimes, setReactionTimes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [targetIdx, setTargetIdx] = useState(null);

  const visualReadyAtRef = useRef(null);
  const inputLockedRef = useRef(false);

  const start = () => {
    setReactionTimes([]);
    setCurrent(0);
    setSubmitted(false);
    setResult(null);
    setStatus("playing");
    nextRound();
  };

  const nextRound = () => {
    inputLockedRef.current = false;
    const target = Math.floor(Math.random() * 9);
    setTargetIdx(target);

    requestAnimationFrame(() => {
      visualReadyAtRef.current = Date.now();
    });
  };

  const handleClick = (idx) => {
    if (status !== "playing") return;
    if (inputLockedRef.current) return;

    inputLockedRef.current = true;

    const now = Date.now();
    const rawRt = now - visualReadyAtRef.current;
    const adjustedRt = Math.max(rawRt, MOTOR_LATENCY_BUFFER);

    setReactionTimes((prev) => [...prev, adjustedRt]);

    if (current + 1 >= rounds) {
      submitSession([...reactionTimes, adjustedRt]);
    } else {
      setCurrent((c) => c + 1);
      setTimeout(nextRound, 250); 
    }
  };

  const submitSession = async (events) => {
    if (submitted) return;
    setSubmitted(true);
    setStatus("loading");

    const avg =
      events.length > 0
        ? Math.round(events.reduce((a, b) => a + b, 0) / events.length)
        : null;

    try {
      const res = await api.post("/game/submit", {
        userId: localStorage.getItem("user_id"),
        gameType: "Visual Search",
        reaction_avg: avg,
        memory_score: null,
        durationMs: events.reduce((a, b) => a + b, 0),
        meta: {
          reactionTimes: events,
          motorLatencyBuffer: MOTOR_LATENCY_BUFFER,
        },
      });

      const recommendations = Array.isArray(res.data.recommendations)
        ? res.data.recommendations
        : [res.data.recommendations || ""];

      setResult({
        stress_level: res.data.stress_level,
        cognitive_score:
          res.data.cognitive_score ??
          res.data.focus_score ??
          avg,
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

  return (
    <div className="pt-24 px-6 min-h-screen text-center">
      <h2 className="text-2xl font-semibold text-teal-700 mb-4">
        Visual Search
      </h2>

      {status === "idle" && (
        <div>
          <p className="mb-2">Rounds: {rounds}</p>
          <input
            type="range"
            min={3}
            max={10}
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

      {status === "playing" && (
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className={`w-16 h-16 rounded border cursor-pointer transition
                ${
                  idx === targetIdx
                    ? "bg-red-400"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              onClick={() => handleClick(idx)}
            />
          ))}
        </div>
      )}

      {status === "loading" && (
        <LoadingScreen message="Submitting..." />
      )}

      {status === "result" && (
        <ResultScreen
          result={result}
          onRetry={start}
          onClose={() => setStatus("idle")}
        />
      )}
    </div>
  );
}
