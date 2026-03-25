import { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";
const token = () => localStorage.getItem("strumly_token");
const AVATAR_COLORS = ["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600","from-red-400 to-rose-600"];
const SKILL_COLOR = { BEGINNER:"text-emerald-400 bg-emerald-400/10 border-emerald-400/30", INTERMEDIATE:"text-blue-400 bg-blue-400/10 border-blue-400/30", ADVANCED:"text-amber-400 bg-amber-400/10 border-amber-400/30", PROFESSIONAL:"text-rose-400 bg-rose-400/10 border-rose-400/30" };

function Avatar({ user, size="md", ring=false }) {
  const m = { sm:"w-8 h-8 text-xs", md:"w-10 h-10 text-sm", lg:"w-16 h-16 text-lg", xl:"w-28 h-28 text-3xl" };
  const c = (user?.username||"").charCodeAt(0) % AVATAR_COLORS.length;
  return (
    <div className={`${m[size]} rounded-full bg-gradient-to-br ${AVATAR_COLORS[c]} flex items-center justify-center font-bold text-white flex-shrink-0 ${ring?"ring-4 ring-amber-400 ring-offset-4 ring-offset-zinc-900":""}`}>
      {((user?.firstName||user?.username||"?")[0]).toUpperCase()}
    </div>
  );
}

function timeAgo(d) {
  const s=(Date.now()-new Date(d))/1000;
  if(s<60) return"just now";if(s<3600) return`${Math.floor(s/60)}m`;if(s<86400) return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`;
}

function FollowButton({ userId, onFollowChange }) {
  const [status, setStatus] = useState("NONE"); // NONE | PENDING | ACCEPTED
  const [followId, setFollowId] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/follow/${userId}/status`, { headers:{ Authorization:`Bearer ${token()}` } })
      .then(r=>r.json()).then(d=>{
        if(d.success){ setStatus(d.data.status); setFollowId(d.data.followId); setFollowerCount(d.data.followerCount); }
      }).catch(()=>{}).finally(()=>setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/follow/${userId}/follow`, { method:"POST", headers:{ Authorization:`Bearer ${token()}` } });
      const d = await res.json();
      if(d.success){ setStatus("PENDING"); setFollowId(d.data.id); if(onFollowChange) onFollowChange("PENDING"); }
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/follow/${userId}/unfollow`, { method:"POST", headers:{ Authorization:`Bearer ${token()}` } });
      setStatus("NONE"); setFollowId(null); setFollowerCount(c=>Math.max(0,c-1));
      if(onFollowChange) onFollowChange("NONE");
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  if(loading) return <div className="w-28 h-9 bg-zinc-800 rounded-lg animate-pulse"/>;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">{followerCount} followers</span>
      {status==="NONE" && (
        <button onClick={handleFollow} className="flex items-center gap-1.5 text-xs text-zinc-900 font-bold bg-amber-400 hover:bg-amber-300 px-4 py-2 rounded-lg transition-all">
          + Follow
        </button>
      )}
      {status==="PENDING" && (
        <button onClick={handleUnfollow} className="flex items-center gap-1.5 text-xs text-zinc-400 border border-zinc-600 hover:border-red-500 hover:text-red-400 px-4 py-2 rounded-lg transition-all">
          Requested ✓
        </button>
      )}
      {status==="ACCEPTED" && (
        <button onClick={handleUnfollow} className="flex items-center gap-1.5 text-xs text-zinc-400 border border-zinc-600 hover:border-red-500 hover:text-red-400 px-4 py-2 rounded-lg transition-all">
          Following ✓
        </button>
      )}
    </div>
  );
}

function PostCard({ post, user }) {
  const [liked,setLiked]=useState(false);
  const [likes,setLikes]=useState(post.likes||0);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex gap-3">
        <Avatar user={user} size="md" ring/>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white text-sm font-semibold">{user.firstName} {user.lastName}</span>
            <span className="text-zinc-500 text-xs">{timeAgo(post.createdAt)}</span>
          </div>
          <p className="text-zinc-200 text-sm leading-relaxed">{post.content}</p>
          <div className="flex items-end gap-[1px] h-5 mt-3 opacity-20">
            {Array.from({length:40},(_,i)=>(
              <div key={i} className="flex-1 bg-amber-400 rounded-sm" style={{height:`${15+Math.sin(i*0.5)*35+Math.random()*20}%`}}/>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <button onClick={()=>{setLiked(l=>!l);setLikes(c=>liked?c-1:c+1);}}
              className={`flex items-center gap-1.5 text-xs transition-colors ${liked?"text-rose-400":"text-zinc-500 hover:text-rose-400"}`}>
              <svg viewBox="0 0 24 24" fill={liked?"currentColor":"none"} stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {likes}
            </button>
            <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              {post.comments||0}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OtherProfilePage({ userId, currentUser, onBack }) {
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followStatus, setFollowStatus] = useState("NONE");
  const [counts, setCounts] = useState({ followers:0, following:0 });

  const mockPosts = profileUser ? [
    { id:"p1", content: profileUser.bio||`Hi! I'm ${profileUser.firstName||profileUser.username}. ${profileUser.instruments?.length>0?`I play ${profileUser.instruments.join(", ")}.`:""} Looking to connect with fellow musicians!`, likes:Math.floor(Math.random()*60)+5, comments:Math.floor(Math.random()*15)+1, createdAt:new Date(Date.now()-86400000).toISOString() },
    { id:"p2", content:`Working on some ${profileUser.genres?.[0]||"new"} material. ${profileUser.location?`Based in ${profileUser.location}.`:""} Always open to jams and collabs 🎵`, likes:Math.floor(Math.random()*40)+3, comments:Math.floor(Math.random()*10)+1, createdAt:new Date(Date.now()-172800000).toISOString() },
  ] : [];

  useEffect(() => {
    if(!userId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/users/${userId}`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
      fetch(`${API_BASE}/follow/${userId}/status`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
      fetch(`${API_BASE}/follow/${userId}/followers`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
      fetch(`${API_BASE}/follow/${userId}/following`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
    ]).then(([userData, statusData, followersData, followingData]) => {
      if(userData.success) setProfileUser(userData.data);
      if(statusData.success) {
        setFollowStatus(statusData.data.status);
        setCounts({ followers: statusData.data.followerCount, following: statusData.data.followingCount });
      }
      if(followersData.success) setFollowers(followersData.data);
      if(followingData.success) setFollowing(followingData.data);
    }).catch(console.error).finally(()=>setLoading(false));
  }, [userId]);

  if(loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex items-end gap-[3px] h-10">
        {[1,2,3,4,5].map(i=>(
          <div key={i} className="w-[3px] bg-amber-400 rounded-full h-full"
            style={{animation:`bb ${.5+i*.12}s ease-in-out infinite alternate`}}/>
        ))}
      </div>
    </div>
  );

  if(!profileUser) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center flex-col gap-4">
      <p className="text-zinc-400">User not found</p>
      <button onClick={onBack} className="text-amber-400 hover:underline">← Go back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Banner */}
      <div className="relative h-52 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-[2px] h-28 px-8 opacity-10">
          {Array.from({length:120},(_,i)=>(
            <div key={i} className="flex-1 bg-amber-400 rounded-t-sm" style={{height:`${20+Math.sin(i*0.3)*50+Math.cos(i*0.7)*30}%`}}/>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-['Bebas_Neue'] text-[5rem] text-zinc-700 opacity-30 tracking-[0.3em] select-none">STRUMLY</span>
        </div>
        <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 text-zinc-300 hover:text-white bg-zinc-900/60 backdrop-blur-sm border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 text-sm transition-all">
          ← Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="relative -mt-14 mb-6">
          <div className="flex items-end justify-between">
            <Avatar user={profileUser} size="xl" ring/>
            <div className="mb-2">
              <FollowButton userId={userId} onFollowChange={status => {
                setFollowStatus(status);
                if(status==="NONE") setCounts(c=>({...c,followers:Math.max(0,c.followers-1)}));
              }}/>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">{profileUser.firstName||""} {profileUser.lastName||""}</h1>
              {profileUser.skillLevel && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${SKILL_COLOR[profileUser.skillLevel]}`}>
                  {profileUser.skillLevel.charAt(0)+profileUser.skillLevel.slice(1).toLowerCase()}
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-sm">@{profileUser.username}</p>
            {profileUser.location && <p className="text-zinc-500 text-sm mt-0.5">📍 {profileUser.location}</p>}
            {profileUser.bio && <p className="text-zinc-300 text-sm mt-3 leading-relaxed">{profileUser.bio}</p>}
          </div>

          {/* Stats */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {[["Posts", mockPosts.length], ["Followers", counts.followers], ["Following", counts.following], profileUser.experience?["Yrs Exp",profileUser.experience]:null].filter(Boolean).map(([l,v])=>(
              <div key={l} className="flex flex-col items-center gap-0.5 px-4 py-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 cursor-pointer hover:border-amber-400/30 transition-colors"
                onClick={()=>{ if(l==="Followers") setActiveTab("followers"); if(l==="Following") setActiveTab("following"); }}>
                <span className="font-['Bebas_Neue'] text-2xl text-amber-400">{v}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">{l}</span>
              </div>
            ))}
          </div>

          {/* Instruments */}
          {profileUser.instruments?.length>0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profileUser.instruments.map(ins=>(
                <span key={ins} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-amber-400 font-medium">🎵 {ins}</span>
              ))}
            </div>
          )}

          {/* Genres */}
          {profileUser.genres?.length>0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {profileUser.genres.map(g=>(
                <span key={g} className="px-3 py-1 bg-zinc-800/50 border border-zinc-800 rounded-full text-xs text-zinc-400">#{g}</span>
              ))}
            </div>
          )}

          {/* Availability */}
          {profileUser.availability && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
              <span className="text-xs text-zinc-400">Available: <span className="text-emerald-400">{profileUser.availability}</span></span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-800 mb-4">
          <div className="flex">
            {["posts","about","followers","following"].map(tab=>(
              <button key={tab} onClick={()=>setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold uppercase tracking-wider transition-all border-b-2 ${activeTab===tab?"border-amber-400 text-amber-400":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-12">
          {activeTab==="posts" && (
            <div className="space-y-4">
              {mockPosts.map(p=><PostCard key={p.id} post={p} user={profileUser}/>)}
            </div>
          )}

          {activeTab==="about" && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h3 className="font-['Bebas_Neue'] text-xl text-white">MUSICIAN <span className="text-amber-400">INFO</span></h3>
              {[
                {icon:"📍",label:"Location",value:profileUser.location},
                {icon:"⏱️",label:"Experience",value:profileUser.experience?`${profileUser.experience} years`:null},
                {icon:"⭐",label:"Skill Level",value:profileUser.skillLevel},
                {icon:"📅",label:"Availability",value:profileUser.availability},
                {icon:"🗓️",label:"Member since",value:new Date(profileUser.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long"})},
              ].filter(i=>i.value).map(({icon,label,value})=>(
                <div key={label} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-lg">{icon}</span>
                  <div><p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p><p className="text-white text-sm font-medium">{value}</p></div>
                </div>
              ))}
            </div>
          )}

          {activeTab==="followers" && (
            <div className="space-y-3">
              {followers.length===0
                ? <p className="text-center text-zinc-500 py-8">No followers yet</p>
                : followers.map((u,i)=>(
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                    <Avatar user={u} size="md" ring/>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{u.firstName} {u.lastName}</p>
                      <p className="text-zinc-500 text-xs">@{u.username}</p>
                      {u.instruments?.length>0 && <p className="text-amber-400 text-xs mt-0.5">{u.instruments.join(", ")}</p>}
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {activeTab==="following" && (
            <div className="space-y-3">
              {following.length===0
                ? <p className="text-center text-zinc-500 py-8">Not following anyone yet</p>
                : following.map((u,i)=>(
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                    <Avatar user={u} size="md" ring/>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{u.firstName} {u.lastName}</p>
                      <p className="text-zinc-500 text-xs">@{u.username}</p>
                      {u.instruments?.length>0 && <p className="text-amber-400 text-xs mt-0.5">{u.instruments.join(", ")}</p>}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
