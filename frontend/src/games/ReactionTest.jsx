import React, { useEffect, useRef, useState } from "react";
import api from "../utils/api";
import LoadingScreen from "../components/LoadingScreen";
import ResultScreen from "../components/ResultScreen";

const MIN_RT = 150;     
const MAX_RT = 800;    

const normalizeRT = (rt) =>
  Math.min(Math.max(Math.round(rt), MIN_RT), MAX_RT);

const computeAvgRT = (times) => {
  if (!times.length) return null;
  if (times.length <= 2) {
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }
  const sorted = [...times].sort((a, b) => a - b);
  sorted.pop(); 
  return Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
};

export default function ReactionTest() {
  const [rounds, setRounds] = useState(6);
  const [status, setStatus] = useState("idle"); 
  const [startAt, setStartAt] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const isGuest = !localStorage.getItem("access_token");

  const timeoutRef = useRef(null);

  const start = () => {
    setReactionTimes([]);
    setFalseStarts(0);
    setSubmitted(false);
    setResult(null);
    setCurrentRound(0);
    setStatus("waiting");
  };

  useEffect(() => {
    if (status === "waiting") {
      const delay = Math.random() * 2000 + 800;
      timeoutRef.current = setTimeout(() => {
        setStatus("ready");
        setStartAt(performance.now());
      }, delay);

      return () => clearTimeout(timeoutRef.current);
    }
  }, [status]);

  const registerReaction = () => {
    if (status === "waiting") {
      setFalseStarts((f) => f + 1);
      setStatus("idle");
      setTimeout(() => setStatus("waiting"), 500);
      return;
    }

    if (status === "ready") {
      const rt = normalizeRT(performance.now() - startAt);
      setReactionTimes((prev) => [...prev, rt]);

      if (currentRound + 1 >= rounds) {
        submitSession([...reactionTimes, rt], falseStarts);
      } else {
        setCurrentRound((r) => r + 1);
        setStatus("idle");
        setTimeout(() => setStatus("waiting"), 400);
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space") {
        registerReaction();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, startAt, reactionTimes, falseStarts]);

  const submitSession = async (events, falseStartsCount) => {
  if (submitted) return;
  setSubmitted(true);
  setStatus("loading");

  const rawAvgRT = computeAvgRT(events);
  const avgRT = rawAvgRT ? Math.round(rawAvgRT / 2) : null;

  try {
    let res;

    if (isGuest) {
      res = await api.post("/game/predict", {
        reaction_avg: avgRT,
        memory_score: null,
      });
    } else {
      res = await api.post("/game/submit", {
        gameType: "Reaction Test",
        reaction_avg: avgRT,
        memory_score: null,
        durationMs: events.reduce((a, b) => a + b, 0),
        meta: {
          raw_events: events,
          normalized_events: events.map(normalizeRT),
          falseStarts: falseStartsCount,
          input: "mouse+keyboard",
        },
      });
    }

    setResult({
      stress_level: res.data.stress_level,
      cognitive_score:
        res.data.cognitive_score ??
        res.data.focus_score ??
        avgRT,
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
        Reaction Test
      </h2>

      {status === "idle" && (
        <div>
          <p className="mb-2">Rounds: {rounds}</p>
          <input
            type="range"
            min={3}
            max={12}
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

      {status === "waiting" && (
        <div
          className="w-72 h-72 mx-auto rounded-2xl flex items-center justify-center bg-red-200 cursor-pointer"
          onClick={registerReaction}
        >
          Wait…
        </div>
      )}

      {status === "ready" && (
        <div
          className="w-72 h-72 mx-auto rounded-2xl flex items-center justify-center bg-green-300 cursor-pointer"
          onClick={registerReaction}
        >
          Click! (or press Space)
        </div>
      )}

      {status === "loading" && (
        <LoadingScreen message="Sending session & analysing..." />
      )}

      {status === "result" && (
        <ResultScreen
          result={result}
          onRetry={start}
          onClose={() => setStatus("idle")}
        />
      )}

      <div className="mt-6 text-sm text-gray-600">
        Round: {currentRound + 1}/{rounds} | Trials:{" "}
        {reactionTimes.length} | False starts: {falseStarts}
      </div>
    </div>
  );
}
