import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api";
const MEDIA = "http://localhost:5000";
const token = () => localStorage.getItem("strumly_token");

const INSTRUMENTS = ["Guitar","Bass","Drums","Piano","Vocals","Violin","Saxophone","Trumpet","Keys","DJ"];
const GENRES = ["Rock","Jazz","Pop","Metal","Blues","Classical","Hip-Hop","Electronic","Folk","Indie"];
const SKILL_LEVELS = ["BEGINNER","INTERMEDIATE","ADVANCED","PROFESSIONAL"];
const SKILL_COLORS = { BEGINNER:"text-emerald-400 bg-emerald-400/10 border-emerald-400/20", INTERMEDIATE:"text-blue-400 bg-blue-400/10 border-blue-400/20", ADVANCED:"text-amber-400 bg-amber-400/10 border-amber-400/20", PROFESSIONAL:"text-rose-400 bg-rose-400/10 border-rose-400/20" };
const AVATAR_COLORS = ["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600"];

function Avatar({ user }) {
  const c = (user?.username||"").charCodeAt(0) % AVATAR_COLORS.length;
  if (user?.profilePicture) return <img src={`${MEDIA}${user.profilePicture}`} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0"/>;
  return <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${AVATAR_COLORS[c]} flex items-center justify-center font-bold text-white text-xl flex-shrink-0`}>{((user?.firstName||user?.username||"?")[0]).toUpperCase()}</div>;
}

function FollowBtn({ userId }) {
  const [status, setStatus] = useState("NONE");
  useEffect(() => {
    fetch(`${API}/follow/${userId}/status`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => { if (d.success) setStatus(d.data.status); }).catch(() => {});
  }, [userId]);

  const click = async () => {
    if (status !== "NONE") return;
    const r = await fetch(`${API}/follow/${userId}/follow`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    const d = await r.json();
    if (d.success) setStatus("PENDING");
  };

  if (status === "PENDING") return <span className="text-xs text-zinc-400 border border-zinc-600 px-3 py-1.5 rounded-lg">Requested ✓</span>;
  if (status === "ACCEPTED") return <span className="text-xs text-emerald-400 border border-emerald-600/40 px-3 py-1.5 rounded-lg">Following ✓</span>;
  return <button onClick={click} className="text-xs text-amber-400 hover:bg-amber-400 hover:text-zinc-900 border border-amber-400/40 px-3 py-1.5 rounded-lg transition-all font-semibold">Follow</button>;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [instrument, setInstrument] = useState("");
  const [genre, setGenre] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("search"); // "search" | "filter"

  const runSearch = useCallback(async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/find?q=${encodeURIComponent(query.trim())}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setResults(data.success ? data.data : []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [query]);

  const runFilter = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (instrument) p.set("instrument", instrument);
      if (genre) p.set("genre", genre);
      if (skillLevel) p.set("skillLevel", skillLevel);
      const res = await fetch(`${API}/users/filter?${p}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setResults(data.success ? data.data : []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [instrument, genre, skillLevel]);

  useEffect(() => {
    if (mode === "filter") {
      const t = setTimeout(runFilter, 300);
      return () => clearTimeout(t);
    }
  }, [mode, instrument, genre, skillLevel, runFilter]);

  const selectCls = "bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-all";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wider">DISCOVER <span className="text-amber-400">MUSICIANS</span></h1>
        <p className="text-zinc-500 text-sm mt-1">Find collaborators by name or filter by instrument, genre and skill</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode("search")} className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${mode==="search"?"bg-amber-400 text-zinc-900":"border border-zinc-700 text-zinc-400 hover:text-white"}`}>Search by Name</button>
        <button onClick={() => { setMode("filter"); runFilter(); }} className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${mode==="filter"?"bg-amber-400 text-zinc-900":"border border-zinc-700 text-zinc-400 hover:text-white"}`}>Filter by Skills</button>
      </div>

      {mode === "search" ? (
        <form onSubmit={e => { e.preventDefault(); runSearch(); }} className="flex gap-2 mb-6">
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or username…"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-all"
          />
          <button type="submit" disabled={loading} className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-900 font-bold text-sm px-5 py-2.5 rounded-xl transition-all">Search</button>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <select value={instrument} onChange={e => setInstrument(e.target.value)} className={selectCls}>
            <option value="">Any Instrument</option>
            {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={genre} onChange={e => setGenre(e.target.value)} className={selectCls}>
            <option value="">Any Genre</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={skillLevel} onChange={e => setSkillLevel(e.target.value)} className={selectCls}>
            <option value="">Any Skill Level</option>
            {SKILL_LEVELS.map(s => <option key={s} value={s}>{s.charAt(0)+s.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"/>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-16 text-zinc-500 text-sm">
          {mode === "search" ? "Search for musicians by name or username" : "No musicians match the selected filters"}
        </div>
      )}

      <div className="space-y-3">
        {results.map(user => (
          <div key={user.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
            <Avatar user={user}/>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-semibold text-sm">{user.firstName} {user.lastName}</p>
                {user.skillLevel && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${SKILL_COLORS[user.skillLevel]||""}`}>{user.skillLevel.toLowerCase()}</span>
                )}
              </div>
              <p className="text-zinc-500 text-xs">@{user.username}</p>
              {user.instruments?.length > 0 && (
                <p className="text-zinc-600 text-xs mt-1">{user.instruments.slice(0,4).join(" · ")}</p>
              )}
              {user.location && <p className="text-zinc-600 text-xs">📍 {user.location}</p>}
            </div>
            <FollowBtn userId={user.id}/>
          </div>
        ))}
      </div>
    </div>
  );
}
