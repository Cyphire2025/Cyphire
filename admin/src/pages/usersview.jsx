import React, { useEffect, useState } from "react";
import { Eye, Trash2, Ban, Shield, UserCog } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState("");

  const USERS_PER_PAGE = 100;

  // Fetch users on mount
  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      setError("Please log in as admin to view users");
      setUsers([]);
      setFiltered([]);
      return;
    }

    fetch(`${API_BASE}/api/admin/users`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          console.error("Users fetch error:", data.error || res.statusText);
          setError(data.error || "Session expired, log in again");
          setUsers([]);
          setFiltered([]);
          return;
        }
        setUsers(data);
        setFiltered(data);
      })
      .catch((err) => {
        console.error("Users fetch exception:", err);
        setError("Failed to load users");
        setUsers([]);
        setFiltered([]);
      });
  }, []);

  // Search effect
  useEffect(() => {
    const query = search.toLowerCase();
    setFiltered(
      Array.isArray(users)
        ? users.filter(
            (u) =>
              u.email?.toLowerCase().includes(query) ||
              u.name?.toLowerCase().includes(query)
          )
        : []
    );
    setPage(1);
  }, [search, users]);

  const totalPages = Math.ceil((filtered?.length || 0) / USERS_PER_PAGE);
  const visibleUsers = Array.isArray(filtered)
    ? filtered.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE)
    : [];

  const handleBlock = async (id) => {
    const token = localStorage.getItem("admin-token");
    const res = await fetch(`${API_BASE}/api/admin/users/${id}/block`, {
      method: "PATCH",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    if (res.ok) alert("Blocked");
    else alert("Failed");
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    const token = localStorage.getItem("admin-token");
    const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    if (res.ok) alert("Deleted");
    else alert("Failed");
  };

  const handleBanIP = async (ip) => {
    const token = localStorage.getItem("admin-token");
    const res = await fetch(`${API_BASE}/api/admin/ban-ip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ ip }),
    });
    if (res.ok) alert("IP Banned");
    else alert("Failed");
  };

  const handleSetPlan = async (id, plan) => {
    const token = localStorage.getItem("admin-token");
    const res = await fetch(`${API_BASE}/api/admin/users/${id}/plan`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ plan }),
    });
    if (res.ok) alert("Plan set");
    else alert("Failed");
  };

  const handleViewProfile = (slug) => {
    window.open(`http://localhost:5173/u/${slug}`, "_blank");
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">All Users</h2>

      {/* 🔍 Search */}
      <input
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 px-4 py-2 rounded-md bg-white/10 border border-white/20 placeholder-white/40 text-white"
      />

      {/* ⚠️ Error display */}
      {error && (
        <p className="text-red-400 text-sm mb-4">
          {error}
        </p>
      )}

      {/* 👥 User List */}
      <div className="space-y-4">
        {visibleUsers.map((user, index) => (
          <div
            key={index}
            className="bg-white/5 p-4 rounded-lg border border-white/10 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{user.name || "Unnamed"}</p>
              <p className="text-white/60 text-sm">{user.email}</p>
              <p className="text-xs text-white/40 mt-1">
                ID: {user._id?.slice(-6)} | Plan: {user.plan || "free"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleViewProfile(user.slug)}
                className="hover:text-sky-400"
                title="View Profile"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => handleBlock(user._id)}
                className="hover:text-yellow-400"
                title="Block"
              >
                <Shield size={18} />
              </button>
              <button
                onClick={() => handleBanIP(user.ip || "unknown")}
                className="hover:text-rose-400"
                title="Ban IP"
              >
                <Ban size={18} />
              </button>
              <button
                onClick={() => handleDelete(user._id)}
                className="hover:text-red-500"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => handleSetPlan(user._id, "plus")}
                className="hover:text-fuchsia-400"
                title="Set Plan"
              >
                <UserCog size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 📄 Pagination */}
      <div className="flex justify-center mt-8 gap-2">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 rounded ${
              page === i + 1
                ? "bg-fuchsia-600 text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
