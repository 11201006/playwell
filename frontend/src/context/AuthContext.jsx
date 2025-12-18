// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import api, { setAuthToken } from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("pw_token");

    if (token) {
      setAuthToken(token);
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const token = localStorage.getItem("pw_token");

      if (token) {
        setAuthToken(token);
        fetchProfile();
      } else {
        logout();
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data.user);
      setLoggedIn(true);

      localStorage.setItem("user_id", res.data.user.id);
    } catch (err) {
      console.log("Token invalid → auto logout");
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token, user) => {
    localStorage.setItem("pw_token", token);
    localStorage.setItem("user_id", user.id);

    setAuthToken(token);

    setUser(user);
    setLoggedIn(true);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("pw_token");
    localStorage.removeItem("user_id");

    setAuthToken(null);
    setLoggedIn(false);
    setUser(null);
  };

  const updateProfile = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider
      value={{
        loggedIn,
        user,
        loading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
