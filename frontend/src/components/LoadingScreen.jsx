import React, { useEffect, useState } from "react";

export default function LoadingScreen({
  message = "Analyzing your session...",
  subMessage = "",
  fullscreen = false,
  showTips = true,
}) {
  const tips = [
    "Cobalah tarik napas perlahan selama 4 detik...",
    "Relaksasikan bahu Anda sebentar.",
    "Fokus pada napas dapat membantu menurunkan stres.",
    "Minum air putih dapat meningkatkan fokus.",
    "Bergerak sebentar dapat memperbaiki mood.",
  ];

  const [currentTip, setCurrentTip] = useState("");

  useEffect(() => {
    if (!showTips) return;
    let index = 0;

    setCurrentTip(tips[0]);

    const interval = setInterval(() => {
      index = (index + 1) % tips.length;
      setCurrentTip(tips[index]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 p-8 text-center
      ${fullscreen ? "fixed inset-0 bg-white/80 backdrop-blur-md z-50" : ""}`}
    >
      {/* Spinner */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 animate-spin shadow-md"></div>

      {/* Main message */}
      <div className="text-lg font-semibold text-gray-700">{message}</div>

      {/* Sub message (optional) */}
      {subMessage && (
        <div className="text-sm text-gray-500">{subMessage}</div>
      )}

      {/* Loading bar */}
      <div className="w-56 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-3 bg-teal-400 w-1/3 animate-[loadingBar_1.8s_ease-in-out_infinite]"></div>
      </div>

      {/* Tips */}
      {showTips && (
        <div className="text-xs text-gray-500 mt-2 italic">{currentTip}</div>
      )}
    </div>
  );
}
