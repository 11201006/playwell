import GameCard from "../components/GameCard";

export default function GameCenter() {
  const games = [
    {
      title: "Reaction Test",
      desc: "Click as fast as possible when the screen turns green.",
      link: "/games/reaction",
    },
    {
      title: "Memory Test",
      desc: "Remember the sequence of highlighted tiles.",
      link: "/games/memory",
    },
    {
      title: "Pattern Memory",
      desc: "Remember the pattern sequence and repeat it correctly.",
      link: "/games/pattern-memory",
    },
    {
      title: "Stroop Test",
      desc: "Select the correct color of the word, not the text itself.",
      link: "/games/stroop-test",
    },
    {
      title: "Visual Search",
      desc: "Find the target object among distractors as fast as possible.",
      link: "/games/visual-search",
    },
    {
      title: "Dual Task",
      desc: "Combine memory and reaction tasks simultaneously.",
      link: "/games/dual-task",
    },
  ];

  return (
    <div className="min-h-screen pt-24 px-6 pb-12 bg-gradient-to-b from-teal-50 to-blue-50">
      <h2 className="text-3xl font-semibold text-teal-700 mb-8 text-center">
        Mini Games
      </h2>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {games.map((g, i) => (
          <GameCard key={i} {...g} />
        ))}
      </div>
    </div>
  );
}
