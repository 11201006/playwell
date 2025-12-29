import { useEffect, useState } from "react";
import api from "../utils/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ mood: null, favorite_game: null });

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const uid = localStorage.getItem("user_id");
    if (!uid) return;

    // Load profile
    api
      .get(`/user/profile/${uid}`)
      .then((r) => {
        setProfile(r.data);
        setForm({
          name: r.data.name,
          age: r.data.age,
          gender: r.data.gender,
          email: r.data.email,
        });
      })
      .catch(() => setMsg({ type: "error", text: "Failed to load profile." }));

    // Load stats
    api
      .get(`/user/stats/${uid}`)
      .then((r) => setStats(r.data))
      .catch(() => console.log("Stats unavailable"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const uid = localStorage.getItem("user_id");
      const res = await api.put(`/user/update/${uid}`, form);

      setProfile(res.data.user);
      setEditMode(false);
      setMsg({ type: "success", text: "Profile updated successfully!" });
    } catch {
      setMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12 bg-gradient-to-b from-blue-50 to-teal-50 flex justify-center">
      <div className="w-full max-w-xl">
        <h2 className="text-3xl font-semibold text-teal-700 mb-8 text-center">
          Your Profile
        </h2>

        {loading && (
          <div className="text-center text-gray-600 animate-pulse">
            Loading profile...
          </div>
        )}

        {msg.text && (
          <div
            className={`mb-4 p-3 rounded-xl text-center ${
              msg.type === "error"
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {msg.text}
          </div>
        )}

        {profile && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-teal-600 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-md">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-800">
                {profile.name}
              </h3>
              <p className="text-gray-500">{profile.email}</p>
            </div>

            {!editMode ? (
              <div className="space-y-4">

                <p>
                  <b>Age:</b> {profile.age || "-"}
                </p>

                <p>
                  <b>Gender:</b> {profile.gender || "-"}
                </p>

                <p>
                  <b>Mood (This Week):</b>{" "}
                  {stats.mood ? (
                    <span className="text-teal-600 font-semibold">
                      {stats.mood}
                    </span>
                  ) : (
                    <span className="text-gray-500">No data yet</span>
                  )}
                </p>

                <p>
                  <b>Favorite Game:</b>{" "}
                  {stats.favorite_game ? (
                    <span className="text-purple-600 font-semibold">
                      {stats.favorite_game}
                    </span>
                  ) : (
                    <span className="text-gray-500">No games played yet</span>
                  )}
                </p>

                <button
                  onClick={() => setEditMode(true)}
                  className="w-full mt-4 bg-teal-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-teal-700 transition"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              // 🌟 EDIT MODE
              <div className="space-y-4">
                <div>
                  <label className="text-sm">Name</label>
                  <input
                    className="w-full p-3 mt-1 border rounded-xl focus:ring-2 focus:ring-teal-400"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">Age</label>
                  <input
                    type="number"
                    className="w-full p-3 mt-1 border rounded-xl focus:ring-2 focus:ring-teal-400"
                    value={form.age}
                    onChange={(e) =>
                      setForm({ ...form, age: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">Gender</label>
                  <select
                    className="w-full p-3 mt-1 border rounded-xl focus:ring-2 focus:ring-teal-400"
                    value={form.gender || ""}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm">Email</label>
                  <input
                    className="w-full p-3 mt-1 border rounded-xl bg-gray-100 cursor-not-allowed"
                    value={form.email}
                    disabled
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setEditMode(false)}
                    className="w-1/2 py-3 rounded-xl border border-gray-400 text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-1/2 bg-teal-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-teal-700 transition"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
