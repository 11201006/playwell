import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function GameCard({
  title,
  desc,
  link,
  image,
  category = "Game",
  lastScore = null,
  locked = false,
}) {
  const { loggedIn } = useContext(AuthContext);

  return (
    <div className="bg-white rounded-2xl p-5 shadow hover:shadow-lg transition relative">

      {/* Game thumbnail */}
      {image && (
        <img 
          src={image} 
          alt={title} 
          className="w-full h-36 object-cover rounded-xl mb-4"
        />
      )}

      {/* Locked badge */}
      {locked && (
        <span className="absolute top-4 right-4 bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
          Locked
        </span>
      )}

      <h3 className="text-xl font-semibold text-teal-700 mb-1">{title}</h3>
      <p className="text-gray-600 mb-4">{desc}</p>

      {/* Last score */}
      {lastScore !== null && (
        <p className="text-sm text-gray-500 mb-2">
          Last score: <span className="font-semibold text-teal-700">{lastScore}</span>
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        {/* Kalau belum login, tampilkan hanya Try Without Login */}
        {!loggedIn ? (
          <Link
            to={`${link}?guest=true`}
            className="inline-block px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600"
          >
            Try Without Login
          </Link>
        ) : (
          // Kalau sudah login, tombol Play biasa
          <Link
            to={locked ? "#" : link}
            className={`inline-block px-4 py-2 text-white rounded-full 
              ${locked ? "bg-gray-400 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600"}`}
          >
            Play
          </Link>
        )}
      </div>
    </div>
  );
}
