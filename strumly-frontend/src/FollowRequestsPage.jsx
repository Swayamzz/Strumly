import { useState, useEffect } from "react";
import toast from "./toast";

const API_BASE = "http://localhost:5000/api";
const MEDIA_BASE = "http://localhost:5000";
const token = () => localStorage.getItem("strumly_token");
const AVATAR_COLORS = ["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600","from-red-400 to-rose-600"];

function Avatar({ user, size = "md" }) {
  const m = { sm:"w-8 h-8 text-xs", md:"w-12 h-12 text-sm", lg:"w-16 h-16 text-base" };
  const c = (user?.username||"").charCodeAt(0) % AVATAR_COLORS.length;
  if (user?.profilePicture) return <img src={`${MEDIA_BASE}${user.profilePicture}`} alt="" className={`${m[size]} rounded-full object-cover flex-shrink-0`}/>;
  return <div className={`${m[size]} rounded-full bg-gradient-to-br ${AVATAR_COLORS[c]} flex items-center justify-center font-bold text-white flex-shrink-0`}>{((user?.firstName||user?.username||"?")[0]).toUpperCase()}</div>;
}

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s/60) + "m ago";
  if (s < 86400) return Math.floor(s/3600) + "h ago";
  return Math.floor(s/86400) + "d ago";
}

export default function FollowRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/follow/requests/pending`, {
      headers: { Authorization: `Bearer ${token()}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setRequests(d.data || []); })
      .catch(() => toast.error("Failed to load follow requests"))
      .finally(() => setLoading(false));
  }, []);

  const respond = async (requestId, action) => {
    setActing(requestId);
    try {
      const url = action === "accept"
        ? `${API_BASE}/follow/${requestId}/accept`
        : `${API_BASE}/follow/${requestId}/decline`;
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` }
      });
      const d = await r.json();
      if (d.success) {
        setRequests(prev => prev.filter(req => req.id !== requestId));
        toast.success(action === "accept" ? "Request accepted" : "Request declined");
      } else {
        toast.error(d.message || "Failed");
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wider">FOLLOW REQUESTS</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {requests.length} pending {requests.length === 1 ? "request" : "requests"}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"/>
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-zinc-400 font-semibold">No pending requests</p>
          <p className="text-zinc-600 text-sm mt-1">When someone requests to follow you, they'll appear here</p>
        </div>
      )}

      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
            <Avatar user={req.follower} size="md"/>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">
                {req.follower?.firstName} {req.follower?.lastName}
              </p>
              <p className="text-zinc-500 text-xs">@{req.follower?.username}</p>
              {req.follower?.instruments?.length > 0 && (
                <p className="text-zinc-600 text-xs mt-0.5">
                  {req.follower.instruments.slice(0, 3).join(" · ")}
                </p>
              )}
              <p className="text-zinc-600 text-xs mt-1">{timeAgo(req.createdAt)}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => respond(req.id, "accept")}
                disabled={acting === req.id}
                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-900 font-bold text-xs px-4 py-2 rounded-lg transition-all"
              >
                Accept
              </button>
              <button
                onClick={() => respond(req.id, "decline")}
                disabled={acting === req.id}
                className="border border-zinc-600 hover:border-zinc-400 text-zinc-400 hover:text-white font-medium text-xs px-4 py-2 rounded-lg transition-all"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
