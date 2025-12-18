import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError("Registration failed. Please check your data.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-teal-50 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg"
      >
        <h2 className="text-3xl font-semibold text-teal-700 text-center mb-6">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 text-red-500 bg-red-100 p-2 rounded text-center text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <input
          className="w-full p-3 mb-3 border rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        {/* Age */}
        <input
          className="w-full p-3 mb-3 border rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none"
          placeholder="Age"
          type="number"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          required
        />

        {/* Gender (Dropdown) */}
        <select
          className="w-full p-3 mb-3 border rounded-xl text-gray-700 focus:ring-2 focus:ring-teal-400 focus:outline-none"
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          required
        >
          <option value="" disabled>
            Select Gender
          </option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        {/* Email */}
        <input
          className="w-full p-3 mb-3 border rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        {/* Password */}
        <input
          type="password"
          className="w-full p-3 mb-6 border rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {/* Register Button */}
        <button className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-teal-700 transition">
          Register
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-teal-600 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
