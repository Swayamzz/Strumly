import { useState, useCallback } from "react";

const API = "http://localhost:5000/api";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const token = localStorage.getItem("token");

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API}/users/find?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data.success ? data.data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, token]);

  const handleFollow = async (userId) => {
    try {
      await fetch(`${API}/follow/${userId}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Explore Musicians</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Search for musicians by name or username to discover new collaborators.
      </p>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username..."
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 8,
            border: "1px solid #ddd", fontSize: 15, outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 24px", background: "#1a1a2e", color: "white",
            border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 15,
          }}
        >
          Search
        </button>
      </form>

      {loading && <p style={{ color: "#888", textAlign: "center" }}>Searching...</p>}

      {!loading && searched && results.length === 0 && (
        <p style={{ color: "#888", textAlign: "center" }}>No musicians found for "{query}"</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {results.map((user) => (
          <div
            key={user.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", background: "#fff", borderRadius: 12,
              border: "1px solid #eee", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", background: "#1a1a2e",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: 18, flexShrink: 0,
              }}>
                {user.profilePicture
                  ? <img src={`http://localhost:5000${user.profilePicture}`} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                  : (user.firstName?.[0] || user.username?.[0] || "?").toUpperCase()
                }
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : user.username}
                </div>
                <div style={{ color: "#888", fontSize: 13 }}>@{user.username}</div>
                {user.instruments?.length > 0 && (
                  <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
                    {user.instruments.slice(0, 3).join(" · ")}
                    {user.skillLevel && ` · ${user.skillLevel}`}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleFollow(user.id)}
              style={{
                padding: "8px 20px", background: "#1a1a2e", color: "white",
                border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13,
              }}
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
