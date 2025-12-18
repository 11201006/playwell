import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import GameCenter from "./pages/GameCenter";
import ReactionTest from "./games/ReactionTest";
import MemoryTest from "./games/MemoryTest";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import PatternMemory from "./games/PatternMemory";
import StroopTest from "./games/StroopTest";
import VisualSearch from "./games/VisualSearch";
import DualTask from "./games/DualTask";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div className="pt-16 min-h-[calc(100vh-96px)]">
        <Routes>

          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* PUBLIC GAMES */}
          <Route path="/games" element={<GameCenter />} />
          <Route path="/games/reaction" element={<ReactionTest />} />
          <Route path="/games/memory" element={<MemoryTest />} />
          <Route path="/games/stroop-test" element={<StroopTest />} />
          <Route path="/games/visual-search" element={<VisualSearch />} />
          <Route path="/games/dual-task" element={<DualTask />} />
          <Route path="/games/pattern-memory" element={<PatternMemory />} />

          {/* ===== PROTECTED USER ROUTES ===== */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

        </Routes>
      </div>

      <Footer />
    </BrowserRouter>
  );
}
