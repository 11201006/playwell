// ProtectedRoute.jsx
import React, { useContext } from "react"; // ✅ tambahkan useContext
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { loggedIn } = useContext(AuthContext);

  if (!loggedIn) return <Navigate to="/login" replace />;

  return children;
}
