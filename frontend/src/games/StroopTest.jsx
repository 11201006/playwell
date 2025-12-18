import React, { useState } from "react";
import api from "../utils/api";
import LoadingScreen from "../components/LoadingScreen";
import ResultScreen from "../components/ResultScreen";

const COLORS = ["Red", "Green", "Blue", "Yellow"];
const COLOR_CODES = { Red: "text-red-600", Green: "text-green-600", Blue: "text-blue-600", Yellow: "text-yellow-600" };

export default function StroopTest() {
  const [rounds, setRounds] = useState(5);
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState("idle");
  const [startAt, setStartAt] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [display, setDisplay] = useState({ word: "", color: "" });
  const [correctCount, setCorrectCount] = useState(0); // track benar

  const start = () => {
    setReactionTimes([]);
    setCurrent(0);
    setSubmitted(false);
    setResult(null);
    setCorrectCount(0);
    nextRound();
    setStatus("playing");
  };

  const nextRound = () => {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    setDisplay({ word, color });
    setStartAt(Date.now());
  };

  const handleClick = (color) => {
    if (status !== "playing") return;
    const rt = Date.now() - startAt;
    setReactionTimes((prev) => [...prev, rt]);

    if (color === display.color) {
      setCorrectCount((c) => c + 1);
    }

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

    const avgReaction = reactionTimes.length
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : null;

    // memory_score: % benar dikalikan 100
    const memoryScore = Math.round((correctCount / rounds) * 100);

    try {
      const res = await api.post("/game/submit", {
        userId: localStorage.getItem("user_id"),
        gameType: "Stroop Test",
        reaction_avg: avgReaction,
        memory_score: memoryScore,
        durationMs: rounds * 2000,
        meta: { reactionTimes, correctCount, rounds },
      });

      const recommendations = Array.isArray(res.data.recommendations)
        ? res.data.recommendations
        : [res.data.recommendations || ""];

      setResult({
        stress_level: res.data.stress_level,
        cognitive_score: res.data.cognitive_score ?? res.data.focus_score ?? avgReaction,
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
      <h2 className="text-2xl font-semibold text-teal-700 mb-4">Stroop Test</h2>

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
        <div className="flex flex-col items-center gap-6">
          <p className={`text-4xl font-bold ${COLOR_CODES[display.color]}`}>{display.word}</p>
          <div className="flex gap-4">
            {COLORS.map((c) => (
              <button key={c} className={`px-4 py-2 rounded border ${COLOR_CODES[c]}`} onClick={() => handleClick(c)}>{c}</button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Correct: {correctCount} / {rounds}
          </p>
        </div>
      )}

      {status === "loading" && <LoadingScreen message="Submitting..." />}
      {status === "result" && <ResultScreen result={result} onRetry={onRetry} onClose={() => setStatus("idle")} />}
    </div>
  );
}
