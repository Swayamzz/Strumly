import { useState, useEffect, useCallback } from "react";
import ProfilePage from "./ProfilePage";
import OtherProfilePage from "./OtherProfilePage";

const API_BASE = "http://localhost:5000/api";
const token = () => localStorage.getItem("strumly_token");
const AVATAR_COLORS = ["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600","from-red-400 to-rose-600"];
const SUGGESTED = [
  {username:"dj_nova",firstName:"DJ",lastName:"Nova",instruments:["DJ"],genres:["Electronic"],skillLevel:"PROFESSIONAL"},
  {username:"tommy_bass",firstName:"Tommy",lastName:"Chen",instruments:["Bass"],genres:["Jazz"],skillLevel:"ADVANCED"},
  {username:"ria_violin",firstName:"Ria",lastName:"Sharma",instruments:["Violin"],genres:["Classical"],skillLevel:"INTERMEDIATE"},
  {username:"max_sax",firstName:"Max",lastName:"Walsh",instruments:["Saxophone"],genres:["Jazz"],skillLevel:"ADVANCED"},
];
const MOCK_POSTS = [
  {id:"m1",author:{id:"mock1",username:"alex_riffs",firstName:"Alex",lastName:"Rivera",instruments:["Guitar"],skillLevel:"ADVANCED"},content:"Just finished recording our first EP! Looking for a bassist to join us for live shows 🎸",likes:47,comments:12,createdAt:new Date(Date.now()-3600000).toISOString(),tags:["Guitar","Rock"]},
  {id:"m2",author:{id:"mock2",username:"sara_beats",firstName:"Sara",lastName:"Kim",instruments:["Drums"],skillLevel:"PROFESSIONAL"},content:"Jam session tonight at Studio B — free for all musicians. Bring your gear! ✨🥁",likes:93,comments:28,createdAt:new Date(Date.now()-7200000).toISOString(),tags:["Drums","Jazz"]},
  {id:"m3",author:{id:"mock3",username:"mike_keys",firstName:"Mike",lastName:"Patel",instruments:["Piano","Keys"],skillLevel:"INTERMEDIATE"},content:"Working on a neo-soul arrangement. Anyone into D'Angelo vibes? Let's collab!",likes:31,comments:9,createdAt:new Date(Date.now()-18000000).toISOString(),tags:["Piano","Soul"]},
];

function timeAgo(d){const s=(Date.now()-new Date(d))/1000;if(s<60)return"just now";if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`;}

function Avatar({user,size="md",ring=false}){
  const m={sm:"w-8 h-8 text-xs",md:"w-10 h-10 text-sm",lg:"w-14 h-14 text-base",xl:"w-20 h-20 text-xl"};
  const c=(user?.username||"").charCodeAt(0)%AVATAR_COLORS.length;
  return(<div className={`${m[size]} rounded-full bg-gradient-to-br ${AVATAR_COLORS[c]} flex items-center justify-center font-bold text-white flex-shrink-0 ${ring?"ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900":""}`}>{((user?.firstName||user?.username||"?")[0]).toUpperCase()}</div>);
}
function MusicBars({small}){return(<div className={`flex items-end gap-[2px] ${small?"h-4":"h-6"}`}>{[1,2,3,4,5].map(i=><div key={i} className={`${small?"w-[2px]":"w-[3px]"} bg-amber-400 rounded-full`} style={{height:`${20+i*8}%`,animation:`bb ${.6+i*.15}s ease-in-out infinite alternate`,animationDelay:`${i*.1}s`}}/>)}</div>);}

const Icon={
  Home:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  Search:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Users:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Music:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Bell:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  User:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Plus:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  LogOut:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Heart:({filled})=><svg viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  Comment:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Share:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16,6 12,2 8,6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
  Check:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20,6 9,17 4,12"/></svg>,
  X:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const SC={BEGINNER:"text-emerald-400",INTERMEDIATE:"text-blue-400",ADVANCED:"text-amber-400",PROFESSIONAL:"text-rose-400"};

// ── CONNECT BUTTON (used in feed & discover) ────────────────────────────────
function ConnectButton({ targetUser, currentUser }) {
  const [status, setStatus] = useState("NONE");
  const [loading, setLoading] = useState(false);

  // skip if mock user (no real id)
  const isReal = targetUser?.id && !targetUser.id.startsWith("mock");
  const isSelf = targetUser?.id === currentUser?.id;

  useEffect(() => {
    if(!isReal || isSelf) return;
    fetch(`${API_BASE}/follow/${targetUser.id}/status`, { headers:{ Authorization:`Bearer ${token()}` } })
      .then(r=>r.json()).then(d=>{ if(d.success) setStatus(d.data.status); }).catch(()=>{});
  }, [targetUser?.id]);

  if(!isReal || isSelf) return (
    <button className="text-xs text-amber-400 hover:text-amber-300 border border-amber-400/30 hover:border-amber-400 px-3 py-1 rounded-full transition-all">Connect</button>
  );

  const handleClick = async () => {
    if(status==="ACCEPTED"||status==="PENDING") return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/follow/${targetUser.id}/follow`, { method:"POST", headers:{ Authorization:`Bearer ${token()}` } });
      const d = await r.json();
      if(d.success) setStatus("PENDING");
    } catch(e) {}
    finally { setLoading(false); }
  };

  if(status==="PENDING") return <span className="text-xs text-zinc-400 border border-zinc-600 px-3 py-1 rounded-full">Requested ✓</span>;
  if(status==="ACCEPTED") return <span className="text-xs text-emerald-400 border border-emerald-600/40 px-3 py-1 rounded-full">Following ✓</span>;
  return (
    <button onClick={handleClick} disabled={loading}
      className="text-xs text-amber-400 hover:bg-amber-400 hover:text-zinc-900 border border-amber-400/40 px-3 py-1 rounded-full transition-all font-semibold disabled:opacity-50">
      {loading?"…":"Connect"}
    </button>
  );
}

// ── NOTIFICATIONS TAB (real follow requests) ────────────────────────────────
function NotificationsTab({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioned, setActioned] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/follow/requests/pending`, { headers:{ Authorization:`Bearer ${token()}` } })
      .then(r=>r.json()).then(d=>{ if(d.success) setRequests(d.data); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  useEffect(()=>{ load(); }, [load]);

  const handleAccept = async (req) => {
    try {
      const r = await fetch(`${API_BASE}/follow/${req.id}/accept`, { method:"POST", headers:{ Authorization:`Bearer ${token()}` } });
      const d = await r.json();
      if(d.success) setActioned(a=>({...a,[req.id]:"accepted"}));
    } catch(e) { alert("Failed: "+e.message); }
  };

  const handleDecline = async (req) => {
    try {
      const r = await fetch(`${API_BASE}/follow/${req.id}/decline`, { method:"POST", headers:{ Authorization:`Bearer ${token()}` } });
      const d = await r.json();
      if(d.success) setActioned(a=>({...a,[req.id]:"declined"}));
    } catch(e) { alert("Failed: "+e.message); }
  };

  const pendingCount = requests.filter(r=>!actioned[r.id]).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Bebas_Neue'] text-2xl text-white">
          NOTIFICATIONS {pendingCount>0 && <span className="text-amber-400">({pendingCount})</span>}
        </h2>
        <button onClick={load} className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-lg transition-all">Refresh</button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex items-end gap-[3px] h-6">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.1}s ease-in-out infinite alternate`}}/>)}</div>
        </div>
      )}

      {!loading && requests.length===0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-zinc-400 font-medium">No notifications yet</p>
          <p className="text-zinc-600 text-sm mt-1">Follow requests will appear here</p>
        </div>
      )}

      <div className="space-y-3">
        {requests.map(req=>{
          const done = actioned[req.id];
          return (
            <div key={req.id} className={`bg-zinc-900 border rounded-xl p-4 transition-all ${done?"border-zinc-800 opacity-60":"border-zinc-800 hover:border-zinc-700"}`}>
              <div className="flex items-center gap-3">
                <Avatar user={req.follower} size="md" ring/>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    <span className="font-semibold">{req.follower.firstName||req.follower.username} {req.follower.lastName||""}</span>
                    {" "}<span className="text-zinc-400">sent you a follow request</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-zinc-500 text-xs">@{req.follower.username}</p>
                    {req.follower.instruments?.length>0 && <>
                      <span className="text-zinc-700">·</span>
                      <p className="text-amber-400 text-xs">{req.follower.instruments.slice(0,2).join(", ")}</p>
                    </>}
                    <span className="text-zinc-700">·</span>
                    <p className="text-zinc-500 text-xs">{timeAgo(req.createdAt)}</p>
                  </div>
                </div>

                {!done ? (
                  <div className="flex gap-2">
                    <button onClick={()=>handleAccept(req)}
                      className="flex items-center gap-1.5 text-xs text-zinc-900 font-bold bg-amber-400 hover:bg-amber-300 px-3 py-2 rounded-lg transition-all">
                      <Icon.Check/> Accept
                    </button>
                    <button onClick={()=>handleDecline(req)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500 px-3 py-2 rounded-lg transition-all">
                      <Icon.X/> Decline
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${done==="accepted"?"text-emerald-400 bg-emerald-400/10":"text-zinc-500 bg-zinc-800"}`}>
                    {done==="accepted"?"Accepted ✓":"Declined"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onAvatarClick }) {
  const [liked,setLiked]=useState(false);
  const [likes,setLikes]=useState(post.likes||0);
  const [showC,setShowC]=useState(false);
  const [comment,setComment]=useState("");
  const isSelf = post.author?.id === currentUser?.id;
  return(
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={()=>!isSelf && onAvatarClick(post.author)}>
          <Avatar user={post.author} size="md" ring/>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold hover:text-amber-400 transition-colors">{post.author.firstName} {post.author.lastName}</span>
              <span className={`text-xs ${SC[post.author.skillLevel]||"text-zinc-400"}`}>{post.author.skillLevel?.toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-xs">@{post.author.username}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 text-xs">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">{(post.author.instruments||[]).slice(0,2).map(ins=><span key={ins} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-amber-400">{ins}</span>)}</div>
      </div>
      <div className="px-4 pb-3">
        <p className="text-zinc-200 text-sm leading-relaxed">{post.content}</p>
        {post.tags?.length>0 && <div className="flex flex-wrap gap-1.5 mt-2">{post.tags.map(t=><span key={t} className="text-xs text-amber-400/70 hover:text-amber-400 cursor-pointer">#{t}</span>)}</div>}
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-end gap-[2px] h-7 opacity-20">{Array.from({length:60},(_,i)=><div key={i} className="flex-1 bg-amber-400 rounded-sm" style={{height:`${10+Math.sin(i*0.4)*40+Math.random()*20}%`}}/>)}</div>
      </div>
      <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={()=>{setLiked(l=>!l);setLikes(c=>liked?c-1:c+1);}} className={`flex items-center gap-1.5 text-sm transition-colors ${liked?"text-rose-400":"text-zinc-400 hover:text-rose-400"}`}><Icon.Heart filled={liked}/><span>{likes}</span></button>
            <button onClick={()=>setShowC(s=>!s)} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-amber-400 transition-colors"><Icon.Comment/><span>{post.comments||0}</span></button>
            <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-blue-400 transition-colors"><Icon.Share/></button>
          </div>
          {!isSelf && <ConnectButton targetUser={post.author} currentUser={currentUser}/>}
        </div>
        {showC && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <div className="flex gap-2">
              <Avatar user={currentUser} size="sm"/>
              <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment…" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"/>
              <button className="text-xs text-amber-400 font-semibold hover:text-amber-300 px-2">Post</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreatePost({user,onPost}){
  const [open,setOpen]=useState(false);
  const [text,setText]=useState("");
  const submit=()=>{if(!text.trim())return;onPost({id:Date.now().toString(),author:user,content:text,likes:0,comments:0,createdAt:new Date().toISOString(),tags:[]});setText("");setOpen(false);};
  return(
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
      {!open
        ?<div className="flex items-center gap-3 cursor-pointer" onClick={()=>setOpen(true)}><Avatar user={user} size="md"/><div className="flex-1 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-full px-4 py-2.5 text-sm text-zinc-500 transition-all">What's happening in your musical world?</div></div>
        :<div><div className="flex gap-3"><Avatar user={user} size="md"/><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Share a jam, find bandmates, post a gig…" rows={3} autoFocus className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 outline-none resize-none leading-relaxed"/></div><div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800"><div className="flex gap-2 items-center"><MusicBars small/><span className="text-xs text-zinc-500 ml-1">Share your sound</span></div><div className="flex gap-2"><button onClick={()=>{setOpen(false);setText("");}} className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-full border border-zinc-700 transition-all">Cancel</button><button onClick={submit} disabled={!text.trim()} className="text-xs text-zinc-900 font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-40 px-4 py-1.5 rounded-full transition-all">Post</button></div></div></div>
      }
    </div>
  );
}

function Stories({currentUser,onProfileClick}){
  const list=[{user:currentUser,own:true},...SUGGESTED.map(u=>({user:u}))];
  return(
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {list.map((s,i)=>(
          <div key={i} onClick={s.own?onProfileClick:undefined} className={`flex flex-col items-center gap-1.5 flex-shrink-0 ${s.own?"cursor-pointer":""} group`}>
            <div className={`p-[2px] rounded-full ${s.own?"border-2 border-dashed border-amber-400/60":"bg-gradient-to-tr from-amber-400 to-orange-500"}`}>
              <div className="bg-zinc-900 p-[2px] rounded-full"><Avatar user={s.user} size="lg"/></div>
            </div>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors truncate max-w-[56px] text-center">{s.own?"You":s.user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeftSidebar({user,activeTab,setActiveTab,onLogout,onProfile,pendingCount}){
  const nav=[
    {id:"home",label:"Home",icon:<Icon.Home/>},
    {id:"search",label:"Discover",icon:<Icon.Search/>},
    {id:"bands",label:"Bands",icon:<Icon.Users/>},
    {id:"feed",label:"Jam Feed",icon:<Icon.Music/>},
    {id:"notifications",label:"Notifications",icon:<Icon.Bell/>,badge:pendingCount},
  ];
  return(
    <div className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 border-r border-zinc-800 bg-zinc-950 px-4 py-6">
      <div className="flex items-center gap-3 mb-10 px-2"><MusicBars/><span className="font-['Bebas_Neue'] text-2xl tracking-widest text-white">STRUMLY</span></div>
      <nav className="flex-1 space-y-1">
        {nav.map(item=>(
          <button key={item.id} onClick={()=>setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab===item.id?"bg-amber-400/10 text-amber-400 border border-amber-400/20":"text-zinc-400 hover:text-white hover:bg-zinc-800"}`}>
            {item.icon}{item.label}
            {item.badge>0 && <span className="ml-auto w-5 h-5 bg-amber-400 text-zinc-900 text-xs font-bold rounded-full flex items-center justify-center">{item.badge}</span>}
          </button>
        ))}
      </nav>
      <button onClick={()=>setActiveTab("home")} className="flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm py-3 rounded-xl transition-all mb-6"><Icon.Plus/>New Post</button>
      <div onClick={onProfile} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-zinc-800 transition-all cursor-pointer group">
        <Avatar user={user} size="md"/>
        <div className="flex-1 min-w-0"><p className="text-white text-sm font-semibold truncate">{user.firstName||user.username}</p><p className="text-zinc-500 text-xs truncate">@{user.username}</p></div>
        <button onClick={e=>{e.stopPropagation();onLogout();}} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"><Icon.LogOut/></button>
      </div>
    </div>
  );
}

function RightSidebar({user,onProfile,onUserClick}){
  const [followed,setFollowed]=useState({});
  const [realUsers,setRealUsers]=useState([]);

  useEffect(()=>{
    fetch(`${API_BASE}/users`,{headers:{Authorization:`Bearer ${token()}`}})
      .then(r=>r.json()).then(d=>{
        if(d.data?.length>0) setRealUsers(d.data.filter(u=>u.id!==user.id).slice(0,4));
      }).catch(()=>{});
  },[]);

  const suggestions = realUsers.length>0 ? realUsers : SUGGESTED;

  return(
    <div className="hidden xl:flex flex-col w-80 h-screen sticky top-0 px-4 py-6 space-y-6 overflow-y-auto">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onProfile}>
        <Avatar user={user} size="md" ring/>
        <div className="flex-1"><p className="text-white text-sm font-semibold group-hover:text-amber-400 transition-colors">{user.firstName} {user.lastName}</p><p className="text-zinc-500 text-xs">@{user.username}</p></div>
        <button className="text-xs text-amber-400 hover:underline">Profile</button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4"><span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Suggested Musicians</span><button className="text-xs text-amber-400">See all</button></div>
        <div className="space-y-4">
          {suggestions.map((m,i)=>(
            <div key={i} className="flex items-center gap-3">
              <div className="cursor-pointer" onClick={()=>m.id&&m.id!==user.id&&onUserClick(m)}><Avatar user={m} size="md"/></div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>m.id&&m.id!==user.id&&onUserClick(m)}>
                <p className="text-white text-sm font-medium truncate hover:text-amber-400 transition-colors">{m.firstName} {m.lastName}</p>
                <p className="text-zinc-500 text-xs truncate">{m.instruments?.join(", ")}</p>
              </div>
              <ConnectButton targetUser={m} currentUser={user}/>
            </div>
          ))}
        </div>
      </div>
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 block mb-4">Trending Now</span>
        <div className="space-y-3">
          {[["#Guitar",234],["#JamSession",187],["#BandWanted",142],["#Jazz",98],["#HomeStudio",76]].map(([tag,count])=>(
            <div key={tag} className="flex items-center justify-between cursor-pointer group">
              <div><p className="text-white text-sm font-medium group-hover:text-amber-400 transition-colors">{tag}</p><p className="text-zinc-500 text-xs">{count} posts</p></div>
              <MusicBars small/>
            </div>
          ))}
        </div>
      </div>
      <p className="text-zinc-700 text-xs">© 2025 Strumly · Made for musicians</p>
    </div>
  );
}

function MobileNav({activeTab,setActiveTab,onProfile,pendingCount}){
  return(
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around py-3 z-50">
      {[{id:"home",icon:<Icon.Home/>},{id:"search",icon:<Icon.Search/>},{id:"notifications",icon:<Icon.Bell/>,badge:pendingCount},{id:"feed",icon:<Icon.Music/>},{id:"profile",icon:<Icon.User/>,action:onProfile}].map(item=>(
        <button key={item.id} onClick={item.action||(()=>setActiveTab(item.id))} className={`relative p-2 rounded-lg transition-colors ${activeTab===item.id?"text-amber-400":"text-zinc-500"}`}>
          {item.icon}
          {item.badge>0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 text-zinc-900 text-[10px] font-bold rounded-full flex items-center justify-center">{item.badge}</span>}
        </button>
      ))}
    </div>
  );
}

function DiscoverTab({currentUser,onUserClick}){
  const [query,setQuery]=useState("");
  const [results,setResults]=useState([]);
  const [allUsers,setAllUsers]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);

  useEffect(()=>{
    fetch(`${API_BASE}/users`,{headers:{Authorization:`Bearer ${token()}`}})
      .then(r=>r.json()).then(d=>{ if(d.data) setAllUsers(d.data.filter(u=>u.id!==currentUser.id)); }).catch(()=>{});
  },[]);

  const search=async()=>{
    if(!query.trim())return;
    setLoading(true);setSearched(true);
    try{
      const r=await fetch(`${API_BASE}/users/search?instrument=${encodeURIComponent(query)}&location=${encodeURIComponent(query)}`,{headers:{Authorization:`Bearer ${token()}`}});
      const d=await r.json();setResults((d.data||[]).filter(u=>u.id!==currentUser.id));
    }catch{setResults([]);}finally{setLoading(false);}
  };

  const display = searched ? results : allUsers.length>0 ? allUsers : SUGGESTED;

  return(
    <div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-3">DISCOVER <span className="text-amber-400">MUSICIANS</span></h2>
        <div className="flex gap-2">
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Search by instrument, genre, location…" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"/>
          <button onClick={search} className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-4 py-2.5 rounded-lg transition-all">Search</button>
        </div>
      </div>
      {loading && <div className="text-center text-zinc-500 py-8">Searching…</div>}
      {!loading && searched && results.length===0 && <div className="text-center text-zinc-500 py-8">No musicians found.</div>}
      <div className="grid grid-cols-2 gap-3">
        {display.map((m,i)=>(
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="cursor-pointer" onClick={()=>m.id&&m.id!==currentUser.id&&onUserClick(m)}><Avatar user={m} size="lg" ring/></div>
              <div className="cursor-pointer" onClick={()=>m.id&&m.id!==currentUser.id&&onUserClick(m)}>
                <p className="text-white text-sm font-semibold hover:text-amber-400 transition-colors">{m.firstName} {m.lastName}</p>
                <p className="text-zinc-500 text-xs">@{m.username}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1">{m.instruments?.map(ins=><span key={ins} className="text-xs px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-amber-400">{ins}</span>)}</div>
              <ConnectButton targetUser={m} currentUser={currentUser}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage({user,onLogout}){
  const [currentUser,setCurrentUser]=useState(user);
  const [activeTab,setActiveTab]=useState("home");
  const [view,setView]=useState({type:"home"}); // {type:"home"} | {type:"myProfile"} | {type:"otherProfile", userId, userData}
  const [posts,setPosts]=useState([]);
  const [loadingPosts,setLoadingPosts]=useState(true);
  const [pendingCount,setPendingCount]=useState(0);

  // Poll pending follow requests count
  useEffect(()=>{
    const load=()=>{
      fetch(`${API_BASE}/follow/requests/pending`,{headers:{Authorization:`Bearer ${token()}`}})
        .then(r=>r.json()).then(d=>{ if(d.success) setPendingCount(d.data.length); }).catch(()=>{});
    };
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return ()=>clearInterval(interval);
  },[]);

  useEffect(()=>{
    const load=async()=>{
      setLoadingPosts(true);
      try{
        const r=await fetch(`${API_BASE}/users`,{headers:{Authorization:`Bearer ${token()}`}});
        const d=await r.json();
        if(d.data?.length>0){
          const rp=d.data.slice(0,6).map(u=>({id:`r-${u.id}`,author:u,content:u.bio||`Hi! I'm ${u.firstName||u.username}${u.instruments?.length>0?`, playing ${u.instruments.join(", ")}`:""}.${u.location?` Based in ${u.location}.`:""} Looking to connect!`,likes:Math.floor(Math.random()*80)+5,comments:Math.floor(Math.random()*20)+1,createdAt:u.createdAt||new Date().toISOString(),tags:[...(u.instruments||[]).slice(0,2),...(u.genres||[]).slice(0,1)]}));
          setPosts([...rp,...MOCK_POSTS]);
        }else{setPosts(MOCK_POSTS);}
      }catch{setPosts(MOCK_POSTS);}
      finally{setLoadingPosts(false);}
    };
    load();
  },[]);

  const handleUserUpdate=u=>{setCurrentUser(u);localStorage.setItem("strumly_user",JSON.stringify(u));};
  const goToOtherProfile=u=>{ if(u?.id) setView({type:"otherProfile",userId:u.id,userData:u}); };
  const goHome=()=>setView({type:"home"});

  const CSS=`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box}body{margin:0;font-family:'DM Sans',sans-serif;background:#09090b}@keyframes bb{from{transform:scaleY(.3);opacity:.5}to{transform:scaleY(1);opacity:1}}.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`;

  if(view.type==="myProfile") return(<><style>{CSS}</style><ProfilePage user={currentUser} onUserUpdate={handleUserUpdate} onBack={goHome}/></>);
  if(view.type==="otherProfile") return(<><style>{CSS}</style><OtherProfilePage userId={view.userId} currentUser={currentUser} onBack={goHome}/></>);

  return(
    <>
      <style>{CSS}</style>
      <div className="min-h-screen bg-zinc-950 text-white flex">
        <LeftSidebar user={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} onProfile={()=>setView({type:"myProfile"})} pendingCount={pendingCount}/>
        <main className="flex-1 min-h-screen overflow-y-auto pb-20 lg:pb-6">
          <div className="max-w-xl mx-auto px-4 pt-6">
            <div className="lg:hidden flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><MusicBars small/><span className="font-['Bebas_Neue'] text-xl tracking-widest text-white">STRUMLY</span></div>
              <button onClick={onLogout} className="text-zinc-500 hover:text-red-400 transition-colors"><Icon.LogOut/></button>
            </div>

            {activeTab==="home"&&(
              <>
                <Stories currentUser={currentUser} onProfileClick={()=>setView({type:"myProfile"})}/>
                <CreatePost user={currentUser} onPost={p=>setPosts(prev=>[p,...prev])}/>
                {loadingPosts
                  ?<div className="flex justify-center py-12"><div className="flex items-end gap-[3px] h-8">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.12}s ease-in-out infinite alternate`}}/>)}</div></div>
                  :posts.map(post=><PostCard key={post.id} post={post} currentUser={currentUser} onAvatarClick={goToOtherProfile}/>)
                }
              </>
            )}
            {activeTab==="search"&&<DiscoverTab currentUser={currentUser} onUserClick={goToOtherProfile}/>}
            {activeTab==="bands"&&(
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-2">BANDS & <span className="text-amber-400">COLLABS</span></h2>
                <p className="text-zinc-400 text-sm mb-4">Browse bands looking for members or create your own.</p>
                <button className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-6 py-2.5 rounded-lg">Coming Soon</button>
              </div>
            )}
            {activeTab==="feed"&&(
              <div>
                <div className="flex items-center gap-3 mb-4"><MusicBars/><h2 className="font-['Bebas_Neue'] text-2xl text-white">JAM <span className="text-amber-400">FEED</span></h2></div>
                {posts.map(post=><PostCard key={post.id} post={post} currentUser={currentUser} onAvatarClick={goToOtherProfile}/>)}
              </div>
            )}
            {activeTab==="notifications"&&<NotificationsTab currentUser={currentUser}/>}
          </div>
        </main>
        <RightSidebar user={currentUser} onProfile={()=>setView({type:"myProfile"})} onUserClick={goToOtherProfile}/>
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onProfile={()=>setView({type:"myProfile"})} pendingCount={pendingCount}/>
      </div>
    </>
  );
}
