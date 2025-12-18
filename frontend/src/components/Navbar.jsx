import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { loggedIn, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="font-bold text-xl text-teal-700">
          PlayWell
        </Link>

        <div className="flex items-center space-x-4">
          <Link to="/" className="hover:text-teal-600">
            Home
          </Link>

          {loggedIn ? (
            <>
              <Link to="/dashboard" className="hover:text-teal-600">
                Dashboard
              </Link>
              <Link to="/games" className="hover:text-teal-600">
                Games
              </Link>
              <Link to="/history" className="hover:text-teal-600">
                History
              </Link>
              <Link to="/profile" className="hover:text-teal-600">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-teal-600">
                Login
              </Link>
              <Link to="/register" className="hover:text-teal-600">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
