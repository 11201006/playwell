import React, { useState, useRef } from "react";
import api from "../utils/api";
import LoadingScreen from "../components/LoadingScreen";
import ResultScreen from "../components/ResultScreen";

const COLORS = ["Red", "Green", "Blue", "Yellow"];
const COLOR_CODES = {
  Red: "text-red-600",
  Green: "text-green-600",
  Blue: "text-blue-600",
  Yellow: "text-yellow-600",
};

const MOTOR_LATENCY_BUFFER = 120; 

export default function StroopTest() {
  const [rounds, setRounds] = useState(5);
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState("idle"); 
  const [reactionTimes, setReactionTimes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [display, setDisplay] = useState({ word: "", color: "" });
  const [correctCount, setCorrectCount] = useState(0);
  const isGuest = !localStorage.getItem("access_token");

  const visualReadyAtRef = useRef(null);
  const inputLockedRef = useRef(false);

  const start = () => {
    setReactionTimes([]);
    setCurrent(0);
    setSubmitted(false);
    setResult(null);
    setCorrectCount(0);
    setStatus("playing");
    nextRound();
  };

  const nextRound = () => {
    inputLockedRef.current = false;

    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    setDisplay({ word, color });

    requestAnimationFrame(() => {
      visualReadyAtRef.current = Date.now();
    });
  };

  const handleClick = (color) => {
    if (status !== "playing") return;
    if (inputLockedRef.current) return;

    inputLockedRef.current = true;

    const now = Date.now();
    const rawRt = now - visualReadyAtRef.current;
    const adjustedRt = Math.max(rawRt, MOTOR_LATENCY_BUFFER);

    setReactionTimes((prev) => [...prev, adjustedRt]);

    if (color === display.color) {
      setCorrectCount((c) => c + 1);
    }

    if (current + 1 >= rounds) {
      submitSession([...reactionTimes, adjustedRt]);
    } else {
      setCurrent((c) => c + 1);
      setTimeout(nextRound, 300);
    }
  };

  const submitSession = async (events) => {
  if (submitted) return;
  setSubmitted(true);
  setStatus("loading");

  const rawAvgReaction =
    events.length > 0
      ? events.reduce((a, b) => a + b, 0) / events.length
      : null;

  const avgReaction = rawAvgReaction
    ? Math.round(rawAvgReaction / 6)
    : null;

  const memoryScore = Math.round((correctCount / rounds) * 100);

  try {
    let res;

    if (isGuest) {
      res = await api.post("/game/predict", {
        reaction_avg: avgReaction,
        memory_score: memoryScore,
      });
    } else {
      res = await api.post("/game/submit", {
        gameType: "Stroop Test",
        reaction_avg: avgReaction,
        memory_score: memoryScore,
        durationMs: events.reduce((a, b) => a + b, 0),
        meta: {
          reactionTimes: events,
          correctCount,
          rounds,
          motorLatencyBuffer: MOTOR_LATENCY_BUFFER,
        },
      });
    }

    setResult({
      stress_level: res.data.stress_level,
      cognitive_score:
        res.data.cognitive_score ??
        res.data.focus_score ??
        avgReaction,
      recommendations: Array.isArray(res.data.recommendations)
        ? res.data.recommendations
        : [res.data.recommendations || ""],
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
        Stroop Test
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
        <div className="flex flex-col items-center gap-6">
          <p
            className={`text-4xl font-bold ${COLOR_CODES[display.color]}`}
          >
            {display.word}
          </p>

          <div className="flex gap-4">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`px-4 py-2 rounded border ${COLOR_CODES[c]} hover:scale-105 transition`}
                onClick={() => handleClick(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <p className="mt-2 text-sm text-gray-600">
            Correct: {correctCount} / {rounds}
          </p>
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
