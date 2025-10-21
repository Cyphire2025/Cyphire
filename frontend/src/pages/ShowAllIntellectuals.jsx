import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function ShowAllIntellectuals() {
  const [list, setList] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    fetch(`${API_BASE}/api/intellectuals`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (Array.isArray(data)) setList(data);
        else if (Array.isArray(data.results)) setList(data.results);
        else setErr("No data found.");
      })
      .catch((e) => setErr(e.message || "Error loading intellectuals"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main style={{ background: "#15181c", color: "#fff", minHeight: "100vh", padding: 24 }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 16 }}>All Intellectuals</h1>
      {loading && <div style={{ fontSize: 18 }}>Loading…</div>}
      {err && <div style={{ color: "#f44" }}>{err}</div>}
      <ol style={{ listStyle: "decimal", paddingLeft: 20, fontSize: 17, maxWidth: 700 }}>
        {list.map((int, i) => (
          <li key={int._id || i} style={{ marginBottom: 12 }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: openIdx === i ? "#23272e" : "#181b20",
                border: "1px solid #31343a",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              <span>
                {int?.profile?.fullName || int?.fullName || "No name"}
                {int?.category ? (
                  <span style={{
                    fontWeight: 400,
                    fontSize: 13,
                    background: "#3fe6ba14",
                    color: "#4de9c0",
                    borderRadius: 6,
                    padding: "2px 8px",
                    marginLeft: 12
                  }}>
                    {int.category}
                  </span>
                ) : null}
                {int?.profile?.institution && (
                  <span style={{
                    fontWeight: 400,
                    fontSize: 13,
                    color: "#aaa",
                    marginLeft: 14
                  }}>
                    {int.profile.institution}
                  </span>
                )}
              </span>
              <span style={{ fontWeight: 400, fontSize: 13, color: "#8af" }}>
                {openIdx === i ? "▲" : "▼"}
              </span>
            </div>
            {/* Details box */}
            {openIdx === i && (
              <div style={{
                background: "#22242a",
                margin: "2px 0 14px 0",
                borderRadius: 6,
                padding: 14,
                fontSize: 15,
                fontWeight: 400,
                color: "#eee"
              }}>
                <DetailRow label="Full Name" value={int?.profile?.fullName || int?.fullName} />
                <DetailRow label="Headline" value={int?.profile?.headline || int?.headline} />
                <DetailRow label="Bio" value={int?.profile?.bio || int?.bio} />
                <DetailRow label="Email" value={int?.profile?.academicEmail || int?.profile?.email || int?.email} />
                <DetailRow label="Institution" value={int?.profile?.institution || int?.institution} />
                <DetailRow label="Department" value={int?.profile?.department || int?.department} />
                <DetailRow label="Designation" value={int?.profile?.designation || int?.designation} />
                <DetailRow label="Expertise" value={Array.isArray(int?.professor?.expertise) ? int.professor.expertise.join(", ") : int?.expertise} />
                <DetailRow label="Publications" value={int?.professor?.publications || int?.publications} />
                <DetailRow label="Google Scholar" value={int?.professor?.googleScholar || int?.googleScholar} />
                <DetailRow label="Languages" value={Array.isArray(int?.profile?.languages) ? int.profile.languages.join(", ") : int?.languages} />
                <DetailRow label="Available for" value={Array.isArray(int?.profile?.availableFor) ? int.profile.availableFor.join(", ") : int?.availableFor} />
                <DetailRow label="Created At" value={int?.createdAt ? new Date(int.createdAt).toLocaleString() : ""} />
                {/* Add more fields as needed */}
              </div>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ color: "#78f7e6", fontWeight: 500 }}>{label}:</span> {value}
    </div>
  );
}
