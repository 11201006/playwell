import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Home() {
  const { loggedIn } = useContext(AuthContext);

  return (
    <div className="min-h-screen pt-24 px-6 pb-16 bg-gradient-to-b from-blue-50 to-teal-50 flex flex-col items-center text-center">
      <h1 className="text-5xl font-extrabold text-teal-700 mb-4 drop-shadow-sm">
        PlayWell
      </h1>

      <p className="max-w-2xl text-gray-700 text-lg leading-relaxed mb-8">
        Improve your mental clarity through short cognitive mini-games.  
        Play reaction & memory tests — the system analyzes your performance to help
        you understand your <b>stress</b> and <b>focus</b> level.
      </p>

      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {!loggedIn && (
          <Link
            to="/register"
            className="bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold shadow transition hover:bg-teal-700"
          >
            Get Started
          </Link>
        )}

        <Link
          to="/games"
          className="bg-white px-8 py-3 rounded-xl font-semibold shadow-md transition hover:shadow-lg"
        >
          Try Games
        </Link>
      </div>
    </div>
  );
}
