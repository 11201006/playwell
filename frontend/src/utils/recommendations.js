// src/utils/recommendations.js

export const recommendationRules = [
  {
    stress_level: "high",
    cognitive_score: { min: 0, max: 100 },
    recommendations: [
      "Take a short break and do breathing exercises.",
      "Reduce distractions and retry shorter sessions."
    ]
  },
  {
    stress_level: "medium",
    cognitive_score: { min: 0, max: 100 },
    recommendations: [
      "Try a short focus exercise (5 minutes).",
      "Repeat the game to build familiarity."
    ]
  },
  {
    stress_level: "low",
    cognitive_score: { min: 0, max: 100 },
    recommendations: [
      "Keep up the good work!",
      "Continue practicing to improve further."
    ]
  },
  {
    stress_level: "any",
    cognitive_score: { min: 0, max: 39 },
    recommendations: ["Consider reviewing basic exercises to improve focus."]
  },
  {
    stress_level: "any",
    cognitive_score: { min: 40, max: 69 },
    recommendations: ["Keep practicing to strengthen your cognitive skills."]
  },
  {
    stress_level: "any",
    cognitive_score: { min: 70, max: 100 },
    recommendations: ["Excellent cognitive performance — keep it up!"]
  }
];

export function getRecommendations({ stress_level, cognitive_score }) {
  const recs = [];
  if (stress_level === undefined || cognitive_score === undefined) return recs;

  recommendationRules.forEach((rule) => {
    const stressMatch =
      rule.stress_level === "any" || rule.stress_level === stress_level;
    const scoreMatch =
      cognitive_score >= rule.cognitive_score.min &&
      cognitive_score <= rule.cognitive_score.max;

    if (stressMatch && scoreMatch) {
      recs.push(...rule.recommendations);
    }
  });

  return recs;
}
