import React, { useState, useRef } from "react";
import api from "../utils/api";
import LoadingScreen from "../components/LoadingScreen";
import ResultScreen from "../components/ResultScreen";

const MOTOR_LATENCY_BUFFER = 220;

export default function DualTask() {
  const [rounds, setRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [status, setStatus] = useState("idle");

  const [reactionTimes, setReactionTimes] = useState([]);
  const [memorySequence, setMemorySequence] = useState([]);
  const [userMemory, setUserMemory] = useState([]);

  const [currentNumber, setCurrentNumber] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const visualReadyAtRef = useRef(null);
  const inputLockedRef = useRef(false);

  const start = () => {
    setReactionTimes([]);
    setMemorySequence([]);
    setUserMemory([]);
    setCurrentRound(0);
    setSubmitted(false);
    setResult(null);
    setStatus("playing");
    nextNumber();
  };

  const nextNumber = () => {
    const num = Math.floor(Math.random() * 9) + 1;
    inputLockedRef.current = false;
    setCurrentNumber(num);

    requestAnimationFrame(() => {
      visualReadyAtRef.current = Date.now();
    });
  };

  const handleClick = (choice) => {
    if (status !== "playing") return;
    if (inputLockedRef.current) return;

    inputLockedRef.current = true;

    const now = Date.now();
    const rawRt = now - visualReadyAtRef.current;

    const adjustedRt = Math.max(rawRt, MOTOR_LATENCY_BUFFER);

    setReactionTimes((prev) => [...prev, adjustedRt]);
    setMemorySequence((prev) => [...prev, currentNumber]);

    if (currentRound + 1 >= rounds) {
      setStatus("memoryInput");
    } else {
      setCurrentRound((c) => c + 1);
      setTimeout(nextNumber, 300);
    }
  };

  const handleMemoryClick = (choice) => {
    if (status !== "memoryInput" || submitted) return;

    const next = [...userMemory, choice];
    setUserMemory(next);

    if (next.length >= memorySequence.length) {
      submitSession(next);
    }
  };

  const submitSession = async (userMemoryInput) => {
    if (submitted) return;
    setSubmitted(true);
    setStatus("loading");

    const avgReaction =
      reactionTimes.length > 0
        ? Math.round(
            reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
          )
        : null;

    const correct = userMemoryInput.filter(
      (val, idx) => val === memorySequence[idx]
    ).length;

    const memoryScore = Math.round(
      (correct / memorySequence.length) * 100
    );

    try {
      const res = await api.post("/game/submit", {
        userId: localStorage.getItem("user_id"),
        gameType: "Dual Task",
        reaction_avg: avgReaction,
        memory_score: memoryScore,
        durationMs: reactionTimes.reduce((a, b) => a + b, 0),
        meta: {
          reactionTimes,
          memorySequence,
          userMemoryInput,
          motorLatencyBuffer: MOTOR_LATENCY_BUFFER,
        },
      });

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
        Dual Task
      </h2>

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

      {status === "playing" && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-xl font-semibold">Click the number:</p>
          <div className="text-4xl font-bold text-teal-700">
            {currentNumber}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            {Array.from({ length: 9 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleClick(idx + 1)}
                className="bg-teal-500 text-white py-6 px-6 rounded-full text-2xl font-bold shadow hover:bg-teal-600 active:scale-95 transition-transform"
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-600">
            Round {currentRound + 1} of {rounds}
          </p>
        </div>
      )}

      {status === "memoryInput" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-semibold">Repeat the sequence:</p>

          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleMemoryClick(idx + 1)}
                className="bg-purple-500 text-white py-6 px-6 rounded-full text-2xl font-bold shadow hover:bg-purple-600 active:scale-95 transition-transform"
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-600">
            Input {userMemory.length} of {memorySequence.length}
          </p>
        </div>
      )}

      {status === "loading" && <LoadingScreen message="Submitting..." />}
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
