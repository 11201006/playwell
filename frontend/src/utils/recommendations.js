// src/utils/recommendations.js

const HIGH_STRESS = [
  "You seem mentally fatigued — taking a short break may help restore focus.",
  "A brief pause and some deep breathing could improve your next performance.",
  "Reducing distractions and returning later may feel more comfortable.",
  "It’s okay to slow down — giving yourself time can improve results.",
  "Stepping away briefly might help you feel more relaxed and focused."
];

const MEDIUM_STRESS = [
  "You’re doing fairly well — a short rest could sharpen your focus.",
  "Trying one more round calmly may improve consistency.",
  "Your performance is stable — staying relaxed can help further.",
  "A brief focus exercise may help before continuing.",
  "You’re on track — maintaining a steady pace can boost results."
];

const LOW_STRESS = [
  "Great work — your focus and control look well balanced.",
  "You’re performing consistently — keep up the good rhythm.",
  "Excellent performance — your current state supports strong focus.",
  "You appear relaxed and attentive — well done!",
  "Keep practicing to maintain this positive performance level."
];

const LOW_COGNITIVE = [
  "This task may feel challenging right now — gradual practice can help.",
  "Taking things step by step may improve comfort and accuracy.",
  "It’s normal to struggle sometimes — steady practice can make a difference."
];

const MID_COGNITIVE = [
  "Your cognitive performance is developing well — consistency will help.",
  "You’re building focus — continued practice can strengthen it further.",
  "You’re progressing — keeping a calm pace may improve accuracy."
];

const HIGH_COGNITIVE = [
  "Your cognitive performance is strong — great job!",
  "You’re demonstrating good mental control and focus.",
  "Excellent cognitive performance — keep up the good work."
];

const randomPickMultiple = (list, n = 2) => {
  const shuffled = [...list].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

export function getRecommendations({ stress_level, cognitive_score }) {
  if (stress_level == null || cognitive_score == null) return null;

  let sourceList = [];

  if (stress_level === "high" || cognitive_score < 40) {
    sourceList = HIGH_STRESS;
  } else if (stress_level === "medium" || cognitive_score < 70) {
    sourceList = MEDIUM_STRESS;
  } else if (cognitive_score < 40) {
    sourceList = LOW_COGNITIVE;
  } else if (cognitive_score < 70) {
    sourceList = MID_COGNITIVE;
  } else {
    sourceList = LOW_STRESS.concat(HIGH_COGNITIVE);
  }

  return randomPickMultiple(sourceList, 2);
}
