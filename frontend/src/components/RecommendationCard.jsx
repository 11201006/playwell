export default function RecommendationCard({ recommendations = [] }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h4 className="font-semibold mb-3 text-teal-700 text-lg">
        Recommendations
      </h4>

      {recommendations.length === 0 ? (
        <p className="text-gray-500 text-sm italic">
          No recommendations available.
        </p>
      ) : (
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          {recommendations.map((r, i) => (
            <li
              key={i}
              className="transition-all duration-200 hover:text-teal-600"
            >
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
