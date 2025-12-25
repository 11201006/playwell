import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // ============================
  // LOAD EMAIL & PASSWORD JIKA ADA
  // ============================
  useEffect(() => {
    const savedEmail = localStorage.getItem("saved_email");
    const savedPassword = localStorage.getItem("saved_password");

    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  const submit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;

    login(token, user);

    localStorage.setItem("userId", user.id);

    localStorage.setItem("saved_email", email);
    localStorage.setItem("saved_password", password);

    navigate("/dashboard");

  } catch (err) {
    setError("Email atau password salah.");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-teal-50 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg"
      >
        <h2 className="text-3xl font-semibold text-teal-700 text-center mb-6">
          Login
        </h2>

        {error && (
          <div className="mb-4 text-red-500 bg-red-100 p-2 rounded text-center text-sm">
            {error}
          </div>
        )}

        <input
          className="w-full p-3 mb-4 border rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 mb-6 border rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-teal-700 transition"
        >
          Login
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          Belum punya akun?{" "}
          <Link to="/register" className="text-teal-600 font-semibold hover:underline">
            Daftar
          </Link>
        </p>
      </form>
    </div>
  );
}
