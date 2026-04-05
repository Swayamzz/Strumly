import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("strumly_token");
const h = () => ({ Authorization: `Bearer ${token()}` });
const hj = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

function timeAgo(d) { const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago"; if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago"; }
function fmt(d) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

const ROLE_COLORS = { ADMIN: "bg-rose-500/20 text-rose-400 border-rose-500/30", BAND_LEADER: "bg-violet-500/20 text-violet-400 border-violet-500/30", MUSICIAN: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
const SKILL_COLORS = { BEGINNER: "text-emerald-400", INTERMEDIATE: "text-blue-400", ADVANCED: "text-amber-400", PROFESSIONAL: "text-rose-400" };
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: "posts", label: "Posts", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  { id: "bands", label: "Bands", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "follows", label: "Follow Requests", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
  { id: "analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

function StatCard({ label, value, sub, color = "amber" }) {
  const c = { amber: "from-amber-400 to-orange-500", rose: "from-rose-400 to-pink-600", violet: "from-violet-400 to-purple-600", emerald: "from-emerald-400 to-teal-600", blue: "from-blue-400 to-cyan-600", zinc: "from-zinc-400 to-zinc-600" };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className={`text-3xl font-bold bg-gradient-to-r ${c[color]} bg-clip-text text-transparent`}>{value ?? "—"}</div>
      <div className="text-zinc-300 font-medium text-sm mt-1">{label}</div>
      {sub && <div className="text-zinc-500 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

function BarChart({ data, color = "#f59e0b", maxBars = 14 }) {
  if (!data?.length) return <div className="text-zinc-600 text-sm text-center py-8">No data</div>;
  const display = data.slice(-maxBars);
  const max = Math.max(...display.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {display.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="w-full rounded-t-sm transition-all" style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%`, backgroundColor: color, opacity: 0.85 }} title={`${d.date || d.name}: ${d.count}`} />
          {display.length <= 10 && <div className="text-zinc-600 text-[9px] truncate w-full text-center">{d.date || d.name}</div>}
        </div>
      ))}
    </div>
  );
}

function HBarChart({ data, color = "#f59e0b" }) {
  if (!data?.length) return <div className="text-zinc-600 text-sm text-center py-4">No data</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="text-zinc-400 text-xs w-24 truncate text-right">{d.name}</div>
          <div className="flex-1 bg-zinc-800 rounded-full h-5 overflow-hidden">
            <div className="h-full rounded-full transition-all flex items-center pl-2" style={{ width: `${Math.max((d.count / max) * 100, 8)}%`, backgroundColor: color }}>
              <span className="text-[10px] font-bold text-zinc-900">{d.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/dashboard`, { headers: h() })
      .then(r => r.json()).then(d => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  return (
    <div className="space-y-6">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">DASHBOARD <span className="text-amber-400">OVERVIEW</span></h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data?.totalUsers} sub={`+${data?.newUsersThisWeek} this week`} color="amber" />
        <StatCard label="Total Posts" value={data?.totalPosts} color="violet" />
        <StatCard label="Total Bands" value={data?.totalBands} color="rose" />
        <StatCard label="Messages Sent" value={data?.totalMessages} color="blue" />
        <StatCard label="Conversations" value={data?.totalConversations} color="emerald" />
        <StatCard label="Pending Follows" value={data?.pendingFollowRequests} color="zinc" />
        <StatCard label="New This Week" value={data?.newUsersThisWeek} color="amber" />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 text-sm">New Registrations — Last 7 Days</h3>
        <BarChart data={data?.registrationGrowth} maxBars={7} />
        <div className="flex justify-between mt-2">
          {data?.registrationGrowth?.map((d, i) => <span key={i} className="text-zinc-600 text-[10px]">{d.date}</span>)}
        </div>
      </div>
    </div>
  );
}

// ── USER MANAGEMENT ───────────────────────────────────────────────────────────
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [updating, setUpdating] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    fetch(`${API}/admin/users?${params}`, { headers: h() })
      .then(r => r.json()).then(d => { if (d.success) setUsers(d.data); })
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => { setLoading(true); const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const changeRole = async (id, role) => {
    setUpdating(id);
    const res = await fetch(`${API}/admin/users/${id}/role`, { method: "PATCH", headers: hj(), body: JSON.stringify({ role }) }).then(r => r.json());
    if (res.success) setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
    setUpdating(null);
  };

  const remove = async (id, username) => {
    if (!confirm(`Delete @${username}? This cannot be undone.`)) return;
    const res = await fetch(`${API}/admin/users/${id}`, { method: "DELETE", headers: h() }).then(r => r.json());
    if (res.success) setUsers(u => u.filter(x => x.id !== id));
    else alert(res.message);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">USER <span className="text-amber-400">MANAGEMENT</span></h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, username, email…"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-amber-400">
          <option value="">All Roles</option>
          <option value="MUSICIAN">Musician</option>
          <option value="BAND_LEADER">Band Leader</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      {loading ? <Loader /> : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 text-zinc-400 text-xs font-medium">{users.length} users</div>
          <div className="divide-y divide-zinc-800/50">
            {users.length === 0 && <div className="text-center text-zinc-500 py-10 text-sm">No users found</div>}
            {users.map(u => (
              <div key={u.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{u.firstName} {u.lastName}</span>
                    <span className="text-zinc-500 text-xs">@{u.username}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                    {u.skillLevel && <span className={`text-[10px] font-medium ${SKILL_COLORS[u.skillLevel]}`}>{u.skillLevel}</span>}
                  </div>
                  <div className="text-zinc-500 text-xs mt-0.5">{u.email} · {fmt(u.createdAt)}</div>
                  <div className="text-zinc-600 text-xs mt-0.5">{u._count.posts} posts · {u._count.followers} followers · {u._count.following} following{u.location ? ` · ${u.location}` : ""}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} disabled={updating === u.id}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400 disabled:opacity-50">
                    <option value="MUSICIAN">Musician</option>
                    <option value="BAND_LEADER">Band Leader</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button onClick={() => remove(u.id, u.username)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── POST MODERATION ───────────────────────────────────────────────────────────
function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/posts`, { headers: h() }).then(r => r.json())
      .then(d => { if (d.success) setPosts(d.data); }).finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const res = await fetch(`${API}/admin/posts/${id}`, { method: "DELETE", headers: h() }).then(r => r.json());
    if (res.success) setPosts(p => p.filter(x => x.id !== id));
    else alert(res.message);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">POST <span className="text-amber-400">MODERATION</span></h2>
      {loading ? <Loader /> : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 text-zinc-400 text-xs font-medium">{posts.length} posts</div>
          <div className="divide-y divide-zinc-800/50">
            {posts.length === 0 && <div className="text-center text-zinc-500 py-10 text-sm">No posts found</div>}
            {posts.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">{p.author?.firstName} {p.author?.lastName}</span>
                    <span className="text-zinc-500 text-xs">@{p.author?.username}</span>
                    <span className="text-zinc-600 text-xs">· {timeAgo(p.createdAt)}</span>
                  </div>
                  <p className="text-zinc-300 text-sm mt-1 line-clamp-2">{p.content || <span className="text-zinc-600 italic">No text</span>}</p>
                  <div className="flex items-center gap-3 mt-1 text-zinc-600 text-xs">
                    <span>❤ {p._count?.likes}</span>
                    <span>💬 {p._count?.comments}</span>
                    {p.media?.length > 0 && <span>📎 {p.media.length} media</span>}
                    {p.tags?.length > 0 && <span>{p.tags.map(t => `#${t}`).join(" ")}</span>}
                  </div>
                </div>
                <button onClick={() => remove(p.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── BAND MANAGEMENT ───────────────────────────────────────────────────────────
function Bands() {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/bands`, { headers: h() }).then(r => r.json())
      .then(d => { if (d.success) setBands(d.data); }).finally(() => setLoading(false));
  }, []);

  const remove = async (id, name) => {
    if (!confirm(`Delete band "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`${API}/admin/bands/${id}`, { method: "DELETE", headers: h() }).then(r => r.json());
    if (res.success) setBands(b => b.filter(x => x.id !== id));
    else alert(res.message);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">BAND <span className="text-amber-400">MANAGEMENT</span></h2>
      {loading ? <Loader /> : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 text-zinc-400 text-xs font-medium">{bands.length} bands</div>
          <div className="divide-y divide-zinc-800/50">
            {bands.length === 0 && <div className="text-center text-zinc-500 py-10 text-sm">No bands found</div>}
            {bands.map(b => (
              <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{b.name}</span>
                    <span className="text-zinc-500 text-xs">{b._count?.members} members</span>
                    {b.location && <span className="text-zinc-600 text-xs">· {b.location}</span>}
                  </div>
                  {b.description && <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{b.description}</p>}
                  {b.genre?.length > 0 && <div className="text-zinc-600 text-xs mt-0.5">{b.genre.join(", ")}</div>}
                  <div className="text-zinc-600 text-xs mt-0.5">
                    Members: {b.members?.map(m => m.user?.username).join(", ")}{b._count?.members > 3 ? ` +${b._count.members - 3} more` : ""}
                  </div>
                </div>
                <button onClick={() => remove(b.id, b.name)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FOLLOW REQUESTS ───────────────────────────────────────────────────────────
function FollowRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/follow-requests`, { headers: h() }).then(r => r.json())
      .then(d => { if (d.success) setRequests(d.data); }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">PENDING FOLLOW <span className="text-amber-400">REQUESTS</span></h2>
      {loading ? <Loader /> : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 text-zinc-400 text-xs font-medium">{requests.length} pending requests</div>
          <div className="divide-y divide-zinc-800/50">
            {requests.length === 0 && <div className="text-center text-zinc-500 py-10 text-sm">No pending follow requests</div>}
            {requests.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <div className="text-white text-sm font-semibold">{r.follower?.firstName} {r.follower?.lastName}</div>
                  <span className="text-zinc-500 text-xs">@{r.follower?.username}</span>
                  <span className="text-zinc-400 text-xs px-2">→</span>
                  <div className="text-white text-sm font-semibold">{r.following?.firstName} {r.following?.lastName}</div>
                  <span className="text-zinc-500 text-xs">@{r.following?.username}</span>
                </div>
                <span className="text-zinc-500 text-xs flex-shrink-0">{timeAgo(r.createdAt)}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30 flex-shrink-0">PENDING</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/analytics`, { headers: h() }).then(r => r.json())
      .then(d => { if (d.success) setData(d.data); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  return (
    <div className="space-y-6">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">PLATFORM <span className="text-amber-400">ANALYTICS</span></h2>

      {/* Top Posters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 text-sm">Top Active Users</h3>
        <div className="space-y-3">
          {data?.topPosters?.length === 0 && <p className="text-zinc-600 text-sm">No data yet</p>}
          {data?.topPosters?.map((u, i) => (
            <div key={u.id} className="flex items-center gap-3">
              <span className="text-zinc-500 text-sm w-5 text-center">{i + 1}</span>
              <div className="flex-1">
                <span className="text-white text-sm font-semibold">{u.firstName} {u.lastName}</span>
                <span className="text-zinc-500 text-xs ml-2">@{u.username}</span>
              </div>
              <span className="text-amber-400 text-xs font-bold">{u._count.posts} posts</span>
              <span className="text-zinc-500 text-xs">{u._count.followers} followers</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Instruments */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 text-sm">Popular Instruments</h3>
          <HBarChart data={data?.topInstruments} color="#f59e0b" />
        </div>

        {/* Top Genres */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 text-sm">Popular Genres</h3>
          <HBarChart data={data?.topGenres} color="#a78bfa" />
        </div>
      </div>

      {/* Registration Growth */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 text-sm">Registration Growth — Last 30 Days</h3>
        <BarChart data={data?.registrationGrowth} maxBars={30} />
        <div className="flex justify-between mt-2 text-zinc-600 text-[10px]">
          <span>{data?.registrationGrowth?.[0]?.date}</span>
          <span>{data?.registrationGrowth?.[data.registrationGrowth.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex justify-center py-16">
      <div className="flex items-end gap-[3px] h-8">
        {[1,2,3,4,5].map(i => <div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{ animation: `bb ${.5+i*.1}s ease-in-out infinite alternate` }} />)}
      </div>
    </div>
  );
}

// ── MAIN ADMIN PAGE ───────────────────────────────────────────────────────────
export default function AdminPage({ currentUser, onBack, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SECTIONS = { dashboard: <Dashboard />, users: <Users />, posts: <Posts />, bands: <Bands />, follows: <FollowRequests />, analytics: <Analytics /> };

  return (
    <>
      <style>{`@keyframes bb{from{transform:scaleY(.3);opacity:.5}to{transform:scaleY(1);opacity:1}}.line-clamp-1{overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical}.line-clamp-2{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}`}</style>
      <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">

        {/* Sidebar */}
        <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static z-30 inset-y-0 left-0 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-200`}>
          {/* Logo */}
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-['Bebas_Neue'] text-xl text-white tracking-wide">STRUMLY <span className="text-amber-400">ADMIN</span></div>
              <div className="text-zinc-500 text-xs">{currentUser?.username}</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">✕</button>
          </div>

          {/* Back button (only shown when accessed from HomePage) */}
          {onBack && <button onClick={onBack} className="flex items-center gap-2 px-5 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm border-b border-zinc-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15,18 9,12 15,6"/></svg>
            Back to App
          </button>}

          {/* Logout button (shown when admin logs in directly) */}
          {onLogout && <button onClick={onLogout} className="flex items-center gap-2 px-5 py-3 text-rose-400 hover:text-white hover:bg-rose-400/10 transition-colors text-sm border-b border-zinc-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>}

          {/* Nav */}
          <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
            {NAV.map(n => (
              <button key={n.id} onClick={() => { setActive(n.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${active === n.id ? "bg-amber-400/10 text-amber-400 font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d={n.icon}/></svg>
                {n.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900 lg:hidden flex-shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="text-zinc-400 hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="font-['Bebas_Neue'] text-lg text-white">{NAV.find(n => n.id === active)?.label}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {SECTIONS[active]}
          </div>
        </div>
      </div>
    </>
  );
}
