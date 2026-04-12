import { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";
const MEDIA_BASE = "http://localhost:5000";
const token = () => localStorage.getItem("strumly_token");
const AVATAR_COLORS = ["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600","from-red-400 to-rose-600"];
const INSTRUMENTS = ["Guitar","Bass","Drums","Piano","Vocals","Violin","Saxophone","Trumpet","Keys","DJ"];
const GENRES = ["Rock","Jazz","Pop","Metal","Blues","Classical","Hip-Hop","Electronic","Folk","Indie"];
const SKILL_LEVELS = ["BEGINNER","INTERMEDIATE","ADVANCED","PROFESSIONAL"];
const SKILL_COLOR = {BEGINNER:"text-emerald-400 bg-emerald-400/10 border-emerald-400/30",INTERMEDIATE:"text-blue-400 bg-blue-400/10 border-blue-400/30",ADVANCED:"text-amber-400 bg-amber-400/10 border-amber-400/30",PROFESSIONAL:"text-rose-400 bg-rose-400/10 border-rose-400/30"};

// Helper: get first media item from post
const getMedia = (post) => post?.media?.[0] || null;

function Avatar({user,size="md",ring=false}){
  const m={sm:"w-8 h-8 text-xs",md:"w-10 h-10 text-sm",lg:"w-16 h-16 text-lg",xl:"w-28 h-28 text-3xl"};
  const c=(user?.username||"").charCodeAt(0)%AVATAR_COLORS.length;
  if(user?.profilePicture)return(<img src={`${MEDIA_BASE}${user.profilePicture}`} alt="" className={`${m[size]} rounded-full object-cover flex-shrink-0 ${ring?"ring-4 ring-amber-400 ring-offset-4 ring-offset-zinc-900":""}`}/>);
  return(<div className={`${m[size]} rounded-full bg-gradient-to-br ${AVATAR_COLORS[c]} flex items-center justify-center font-bold text-white flex-shrink-0 ${ring?"ring-4 ring-amber-400 ring-offset-4 ring-offset-zinc-900":""}`}>{((user?.firstName||user?.username||"?")[0]).toUpperCase()}</div>);
}
function Field({label,error,textarea,...props}){const cls=`w-full bg-zinc-800/60 border rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 ${error?"border-red-500":"border-zinc-700"}`;return(<div>{label&&<label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">{label}</label>}{textarea?<textarea {...props} rows={3} className={cls+" resize-none"}/>:<input {...props} className={cls}/>}{error&&<p className="mt-1 text-xs text-red-400">{error}</p>}</div>);}
function MultiSelect({options,selected,onChange,label}){const toggle=opt=>onChange(selected.includes(opt)?selected.filter(x=>x!==opt):[...selected,opt]);return(<div><label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">{label}</label><div className="flex flex-wrap gap-2">{options.map(opt=><button key={opt} type="button" onClick={()=>toggle(opt)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selected.includes(opt)?"bg-amber-400 border-amber-400 text-zinc-900":"bg-transparent border-zinc-600 text-zinc-400 hover:border-amber-400 hover:text-amber-400"}`}>{opt}</button>)}</div></div>);}
function timeAgo(d){const s=(Date.now()-new Date(d))/1000;if(s<60)return"just now";if(s<3600)return Math.floor(s/60)+"m";if(s<86400)return Math.floor(s/3600)+"h";return Math.floor(s/86400)+"d";}

function EditModal({user,onClose,onSave}){
  const [form,setForm]=useState({firstName:user.firstName||"",lastName:user.lastName||"",bio:user.bio||"",location:user.location||"",instruments:user.instruments||[],genres:user.genres||[],skillLevel:user.skillLevel||"",experience:user.experience||"",availability:user.availability||""});
  const [picFile,setPicFile]=useState(null);
  const [picPreview,setPicPreview]=useState(user.profilePicture?`${MEDIA_BASE}${user.profilePicture}`:null);
  const [loading,setLoading]=useState(false);const [msg,setMsg]=useState({type:"",text:""});
  const set=f=>e=>setForm({...form,[f]:e.target.value});
  const handlePic=e=>{const f=e.target.files[0];if(!f)return;setPicFile(f);setPicPreview(URL.createObjectURL(f));};
  const save=async()=>{setLoading(true);setMsg({type:"",text:""});try{
    const fd=new FormData();
    Object.entries(form).forEach(([k,v])=>{if(Array.isArray(v))v.forEach(i=>fd.append(k,i));else if(v!=="")fd.append(k,v);});
    if(form.experience)fd.set("experience",parseInt(form.experience));
    if(picFile)fd.append("profilePicture",picFile);
    const res=await fetch(`${API_BASE}/auth/profile`,{method:"PUT",headers:{Authorization:`Bearer ${token()}`},body:fd});
    const data=await res.json();if(!data.success)throw new Error(data.message);setMsg({type:"ok",text:"Profile updated!"});setTimeout(()=>{onSave(data.data);onClose();},800);}catch(e){setMsg({type:"err",text:e.message||"Failed"});}finally{setLoading(false);}};
  return(<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/><div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"><div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between rounded-t-2xl"><h2 className="font-['Bebas_Neue'] text-2xl text-white">EDIT <span className="text-amber-400">PROFILE</span></h2><button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">✕</button></div><div className="p-6 space-y-4">
  <div className="flex flex-col items-center gap-3">
    <div className="relative">
      {picPreview?<img src={picPreview} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-amber-400 ring-offset-4 ring-offset-zinc-900"/>:<div className={`w-24 h-24 rounded-full bg-gradient-to-br ${["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600","from-red-400 to-rose-600"][(user?.username||"").charCodeAt(0)%6]} flex items-center justify-center font-bold text-white text-3xl ring-4 ring-zinc-700 ring-offset-4 ring-offset-zinc-900`}>{((user?.firstName||user?.username||"?")[0]).toUpperCase()}</div>}
      <label className="absolute bottom-0 right-0 bg-amber-400 hover:bg-amber-300 text-zinc-900 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><input type="file" accept="image/*" onChange={handlePic} className="hidden"/></label>
    </div>
    <p className="text-zinc-500 text-xs">Click the button to change photo</p>
  </div>
  <div className="grid grid-cols-2 gap-3"><Field label="First Name" value={form.firstName} onChange={set("firstName")} placeholder="Jane"/><Field label="Last Name" value={form.lastName} onChange={set("lastName")} placeholder="Doe"/></div><Field label="Bio" textarea value={form.bio} onChange={set("bio")} placeholder="Tell musicians about yourself…"/><Field label="Location" value={form.location} onChange={set("location")} placeholder="Kathmandu, Nepal"/><Field label="Availability" value={form.availability} onChange={set("availability")} placeholder="Weekends, Evenings…"/><div className="grid grid-cols-2 gap-3"><Field label="Experience (yrs)" type="number" value={form.experience} onChange={set("experience")} placeholder="3"/><div><label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Skill Level</label><select value={form.skillLevel} onChange={set("skillLevel")} className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-amber-400 transition-all"><option value="">Select</option>{SKILL_LEVELS.map(l=><option key={l} value={l}>{l.charAt(0)+l.slice(1).toLowerCase()}</option>)}</select></div></div><MultiSelect label="Instruments" options={INSTRUMENTS} selected={form.instruments} onChange={v=>setForm({...form,instruments:v})}/><MultiSelect label="Genres" options={GENRES} selected={form.genres} onChange={v=>setForm({...form,genres:v})}/>{msg.text&&<div className={`rounded-lg px-4 py-3 text-sm border ${msg.type==="ok"?"bg-emerald-900/30 border-emerald-700 text-emerald-400":"bg-red-900/30 border-red-700 text-red-400"}`}>{msg.text}</div>}<div className="flex gap-3 pt-2"><button onClick={onClose} className="flex-1 border border-zinc-600 hover:border-zinc-400 text-zinc-300 font-semibold text-sm py-3 rounded-lg">Cancel</button><button onClick={save} disabled={loading} className="flex-[2] bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-900 font-bold text-sm uppercase tracking-widest py-3 rounded-lg">{loading?"Saving…":"Save Changes"}</button></div></div></div></div>);
}

function PasswordModal({onClose}){
  const [form,setForm]=useState({currentPassword:"",newPassword:"",confirmPassword:""});
  const [loading,setLoading]=useState(false);const [msg,setMsg]=useState({type:"",text:""});
  const set=f=>e=>setForm({...form,[f]:e.target.value});
  const submit=async()=>{if(form.newPassword!==form.confirmPassword){setMsg({type:"err",text:"Passwords don't match"});return;}if(form.newPassword.length<6){setMsg({type:"err",text:"Min 6 chars"});return;}setLoading(true);setMsg({type:"",text:""});try{const res=await fetch(`${API_BASE}/auth/change-password`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token()}`},body:JSON.stringify({currentPassword:form.currentPassword,newPassword:form.newPassword})});const data=await res.json();if(!data.success)throw new Error(data.message);setMsg({type:"ok",text:"Password changed!"});setTimeout(onClose,1500);}catch(e){setMsg({type:"err",text:e.message||"Failed"});}finally{setLoading(false);}};
  return(<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/><div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md"><div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between"><h2 className="font-['Bebas_Neue'] text-2xl text-white">CHANGE <span className="text-amber-400">PASSWORD</span></h2><button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">✕</button></div><div className="p-6 space-y-4"><Field label="Current Password" type="password" placeholder="••••••••" value={form.currentPassword} onChange={set("currentPassword")}/><Field label="New Password" type="password" placeholder="min 6 chars" value={form.newPassword} onChange={set("newPassword")}/><Field label="Confirm New Password" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")}/>{msg.text&&<div className={`rounded-lg px-4 py-3 text-sm border ${msg.type==="ok"?"bg-emerald-900/30 border-emerald-700 text-emerald-400":"bg-red-900/30 border-red-700 text-red-400"}`}>{msg.text}</div>}<div className="flex gap-3 pt-2"><button onClick={onClose} className="flex-1 border border-zinc-600 text-zinc-300 font-semibold text-sm py-3 rounded-lg">Cancel</button><button onClick={submit} disabled={loading} className="flex-[2] bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-900 font-bold text-sm uppercase tracking-widest py-3 rounded-lg">{loading?"Saving…":"Update Password"}</button></div></div></div></div>);
}

// ─── PostCard — uses media[0] ─────────────────────────────────────────────────
function PostCard({post,user}){
  const [liked,setLiked]=useState(false);
  const [likes,setLikes]=useState(post._count?.likes||0);
  const media=getMedia(post);
  return(
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex gap-3">
        <Avatar user={user} size="md" ring/>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white text-sm font-semibold">{user.firstName} {user.lastName}</span>
            <span className="text-zinc-500 text-xs">{timeAgo(post.createdAt)}</span>
          </div>
          {post.content&&<p className="text-zinc-200 text-sm leading-relaxed">{post.content}</p>}
          {/* ── Media: read from media[0] ── */}
          {media&&(
            <div className="mt-3 rounded-xl overflow-hidden bg-zinc-800">
              {media.type==="VIDEO"
                ? <video src={`${MEDIA_BASE}${media.url}`} controls className="w-full max-h-64 object-cover"/>
                : <img src={`${MEDIA_BASE}${media.url}`} alt="" className="w-full max-h-64 object-cover"/>
              }
            </div>
          )}
          <div className="flex items-center gap-4 mt-3">
            <button onClick={()=>{setLiked(l=>!l);setLikes(c=>liked?c-1:c+1);}} className={`flex items-center gap-1.5 text-xs transition-colors ${liked?"text-rose-400":"text-zinc-500 hover:text-rose-400"}`}>
              <svg viewBox="0 0 24 24" fill={liked?"currentColor":"none"} stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              {likes}
            </button>
            <span className="text-zinc-600 text-xs">{post._count?.comments||0} comments</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MediaGrid — uses media[0] ────────────────────────────────────────────────
function MediaGrid({posts}){
  const [selected,setSelected]=useState(null);
  const mediaPosts=posts.filter(p=>getMedia(p));
  if(mediaPosts.length===0)return(
    <div className="text-center py-12">
      <div className="text-5xl mb-3">🎵</div>
      <p className="text-zinc-400 font-medium">No media yet</p>
      <p className="text-zinc-600 text-sm mt-1">Post photos or videos to see them here</p>
    </div>
  );
  return(
    <>
      {selected&&(
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div className="relative max-w-2xl w-full" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setSelected(null)} className="absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center">✕</button>
            {(() => {
              const m = getMedia(selected);
              return m?.type==="VIDEO"
                ? <video src={`${MEDIA_BASE}${m.url}`} controls autoPlay className="w-full rounded-xl max-h-[80vh]"/>
                : <img src={`${MEDIA_BASE}${m.url}`} alt="" className="w-full rounded-xl max-h-[80vh] object-contain"/>;
            })()}
            {selected.content&&<p className="text-white text-sm mt-3 px-2">{selected.content}</p>}
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-1">
        {mediaPosts.map((p,i)=>{
          const m=getMedia(p);
          return(
            <div key={i} className="aspect-square bg-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group" onClick={()=>setSelected(p)}>
              {m?.type==="VIDEO"
                ?<><video src={`${MEDIA_BASE}${m.url}`} className="w-full h-full object-cover"/><div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-1"><polygon points="5,3 19,12 5,21"/></svg></div></div></>
                :<img src={`${MEDIA_BASE}${m.url}`} alt="" className="w-full h-full object-cover"/>
              }
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function ProfilePage({user,onUserUpdate,onBack}){
  const [profileUser,setProfileUser]=useState(user);
  const [showEdit,setShowEdit]=useState(false);
  const [showPwd,setShowPwd]=useState(false);
  const [activeTab,setActiveTab]=useState("posts");
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [followerCount,setFollowerCount]=useState(0);
  const [followingCount,setFollowingCount]=useState(0);
  const [followers,setFollowers]=useState([]);
  const [following,setFollowing]=useState([]);
  const [listsLoaded,setListsLoaded]=useState(false);
  const [followBackLoading,setFollowBackLoading]=useState({});
  const [followBackStatus,setFollowBackStatus]=useState({}); // userId -> "requested"|"following"
  const [showFollowModal,setShowFollowModal]=useState(null); // "followers" | "following" | null

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try{
        const [meRes,postsRes,statsRes]=await Promise.all([
          fetch(`${API_BASE}/auth/me`,{headers:{Authorization:`Bearer ${token()}`}}),
          fetch(`${API_BASE}/posts/user/${user.id}`,{headers:{Authorization:`Bearer ${token()}`}}),
          fetch(`${API_BASE}/follow/${user.id}/status`,{headers:{Authorization:`Bearer ${token()}`}}),
        ]);
        const [meData,postsData,statsData]=await Promise.all([meRes.json(),postsRes.json(),statsRes.json()]);
        if(meData.success)setProfileUser(meData.data);
        if(postsData.success)setPosts(postsData.data);
        if(statsData.success){setFollowerCount(statsData.data.followerCount);setFollowingCount(statsData.data.followingCount);}
      }catch(e){}finally{setLoading(false);}
    };
    load();
  },[user.id]);

  const handleSave=u=>{setProfileUser(u);if(onUserUpdate)onUserUpdate(u);};
  const handleFollowBack=async(targetId)=>{
    setFollowBackLoading(l=>({...l,[targetId]:true}));
    try{
      const res=await fetch(`${API_BASE}/follow/${targetId}/follow`,{method:"POST",headers:{Authorization:`Bearer ${token()}`}});
      const d=await res.json();
      if(d.success){
        setFollowBackStatus(s=>({...s,[targetId]:"requested"}));
      } else if(d.message==="Already following"){
        setFollowBackStatus(s=>({...s,[targetId]:"following"}));
      } else if(d.message==="Request already sent"){
        setFollowBackStatus(s=>({...s,[targetId]:"requested"}));
      }
    }catch(e){}finally{setFollowBackLoading(l=>({...l,[targetId]:false}));}
  };

  useEffect(()=>{
    if((activeTab==="followers"||activeTab==="following")&&!listsLoaded){
      Promise.all([
        fetch(`${API_BASE}/follow/${user.id}/followers`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()),
        fetch(`${API_BASE}/follow/${user.id}/following`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()),
      ]).then(([fd,fing])=>{
        if(fd.success)setFollowers(fd.data);
        if(fing.success)setFollowing(fing.data);
        setListsLoaded(true);
      }).catch(()=>setListsLoaded(true));
    }
  },[activeTab,listsLoaded,user.id]);

  return(
    <>
      {showEdit&&<EditModal user={profileUser} onClose={()=>setShowEdit(false)} onSave={handleSave}/>}
      {showPwd&&<PasswordModal onClose={()=>setShowPwd(false)}/>}
      {showFollowModal&&(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={()=>setShowFollowModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 rounded-t-2xl">
              <div className="flex gap-1 bg-zinc-800 rounded-xl p-1">
                <button onClick={()=>setShowFollowModal("followers")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${showFollowModal==="followers"?"bg-amber-400 text-zinc-900":"text-zinc-400 hover:text-white"}`}>Followers <span className="text-xs opacity-70">({followerCount})</span></button>
                <button onClick={()=>setShowFollowModal("following")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${showFollowModal==="following"?"bg-amber-400 text-zinc-900":"text-zinc-400 hover:text-white"}`}>Following <span className="text-xs opacity-70">({followingCount})</span></button>
              </div>
              <button onClick={()=>setShowFollowModal(null)} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {!listsLoaded&&<div className="flex justify-center py-10"><div className="flex items-end gap-[3px] h-8">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.1}s ease-in-out infinite alternate`}}/>)}</div></div>}
              {listsLoaded&&(showFollowModal==="followers"?followers:following).length===0&&(
                <div className="text-center py-12"><div className="text-4xl mb-2">{showFollowModal==="followers"?"👥":"🎵"}</div><p className="text-zinc-400 text-sm">{showFollowModal==="followers"?"No followers yet":"Not following anyone yet"}</p></div>
              )}
              {listsLoaded&&(showFollowModal==="followers"?followers:following).map((u,i)=>{
                const fbStatus=followBackStatus[u.id];
                const isFollowing=following.some(f=>f.id===u.id)||fbStatus==="following";
                return(
                  <div key={u.id||i} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                    <Avatar user={u} size="md"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{u.firstName||""} {u.lastName||""}</p>
                      <p className="text-zinc-500 text-xs">@{u.username}</p>
                      {u.instruments?.length>0&&<p className="text-amber-400 text-xs mt-0.5 truncate">{u.instruments.slice(0,2).join(" · ")}</p>}
                    </div>
                    {showFollowModal==="followers"&&(
                      isFollowing
                        ?<span className="text-xs text-emerald-400 border border-emerald-600/40 px-3 py-1 rounded-full flex-shrink-0">Following ✓</span>
                        :fbStatus==="requested"
                          ?<span className="text-xs text-zinc-400 border border-zinc-600 px-3 py-1 rounded-full flex-shrink-0">Requested ✓</span>
                          :<button onClick={()=>handleFollowBack(u.id)} disabled={!!followBackLoading[u.id]} className="text-xs text-amber-400 hover:bg-amber-400 hover:text-zinc-900 border border-amber-400/40 px-3 py-1 rounded-full transition-all font-semibold disabled:opacity-50 flex-shrink-0">{followBackLoading[u.id]?"…":"Follow Back"}</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-zinc-950">
        <div className="relative h-52 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05]" style={{backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-[2px] h-28 px-8 opacity-10">{Array.from({length:120},(_,i)=><div key={i} className="flex-1 bg-amber-400 rounded-t-sm" style={{height:`${20+Math.sin(i*0.3)*50+Math.cos(i*0.7)*30}%`}}/>)}</div>
          <div className="absolute inset-0 flex items-center justify-center"><span className="font-['Bebas_Neue'] text-[5rem] text-zinc-700 opacity-30 tracking-[0.3em] select-none">STRUMLY</span></div>
          <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 text-zinc-300 hover:text-white bg-zinc-900/60 backdrop-blur-sm border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 text-sm transition-all">← Back</button>
        </div>

        <div className="max-w-2xl mx-auto px-4">
          <div className="relative -mt-14 mb-6">
            <div className="flex items-end justify-between">
              <Avatar user={profileUser} size="xl" ring/>
              <div className="flex gap-2 mb-2">
                <button onClick={()=>setShowPwd(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-2 rounded-lg transition-all">🔒 Password</button>
                <button onClick={()=>setShowEdit(true)} className="flex items-center gap-1.5 text-xs text-zinc-900 font-bold bg-amber-400 hover:bg-amber-300 px-4 py-2 rounded-lg transition-all">✏️ Edit Profile</button>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">{profileUser.firstName||""} {profileUser.lastName||""}</h1>
                {profileUser.skillLevel&&<span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${SKILL_COLOR[profileUser.skillLevel]}`}>{profileUser.skillLevel.charAt(0)+profileUser.skillLevel.slice(1).toLowerCase()}</span>}
              </div>
              <p className="text-zinc-500 text-sm">@{profileUser.username}</p>
              {profileUser.location&&<p className="text-zinc-500 text-sm mt-0.5">📍 {profileUser.location}</p>}
              {profileUser.bio&&<p className="text-zinc-300 text-sm mt-3 leading-relaxed">{profileUser.bio}</p>}
            </div>
            <div className="flex gap-3 mt-4 flex-wrap">
              {[["Posts",posts.length],["Followers",followerCount],["Following",followingCount],profileUser.experience?["Yrs Exp",profileUser.experience]:null].filter(Boolean).map(([l,v])=>(
                <div key={l} onClick={()=>{if(l==="Followers"){if(!listsLoaded){Promise.all([fetch(`${API_BASE}/follow/${user.id}/followers`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()),fetch(`${API_BASE}/follow/${user.id}/following`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json())]).then(([fd,fing])=>{if(fd.success)setFollowers(fd.data);if(fing.success)setFollowing(fing.data);setListsLoaded(true);});}setShowFollowModal("followers");}if(l==="Following"){if(!listsLoaded){Promise.all([fetch(`${API_BASE}/follow/${user.id}/followers`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()),fetch(`${API_BASE}/follow/${user.id}/following`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json())]).then(([fd,fing])=>{if(fd.success)setFollowers(fd.data);if(fing.success)setFollowing(fing.data);setListsLoaded(true);});}setShowFollowModal("following");}}}
                  className={`flex flex-col items-center gap-0.5 px-4 py-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 transition-all ${(l==="Followers"||l==="Following")?"cursor-pointer hover:border-amber-400/50 hover:bg-zinc-800":""}`}>
                  <span className="font-['Bebas_Neue'] text-2xl text-amber-400">{v}</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">{l}</span>
                </div>
              ))}
            </div>
            {profileUser.instruments?.length>0&&<div className="flex flex-wrap gap-2 mt-4">{profileUser.instruments.map(ins=><span key={ins} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-amber-400 font-medium">🎵 {ins}</span>)}</div>}
            {profileUser.genres?.length>0&&<div className="flex flex-wrap gap-2 mt-2">{profileUser.genres.map(g=><span key={g} className="px-3 py-1 bg-zinc-800/50 border border-zinc-800 rounded-full text-xs text-zinc-400">#{g}</span>)}</div>}
            {profileUser.availability&&<div className="mt-3 flex items-center gap-2"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/><span className="text-xs text-zinc-400">Available: <span className="text-emerald-400">{profileUser.availability}</span></span></div>}
          </div>

          <div className="border-b border-zinc-800 mb-4">
            <div className="flex overflow-x-auto scrollbar-hide">{["posts","media","about","followers","following"].map(tab=><button key={tab} onClick={()=>setActiveTab(tab)} className={`px-5 py-3 text-sm font-semibold uppercase tracking-wider transition-all border-b-2 flex-shrink-0 ${activeTab===tab?"border-amber-400 text-amber-400":"border-transparent text-zinc-500 hover:text-zinc-300"}`}>{tab}</button>)}</div>
          </div>

          {loading
            ? <div className="flex justify-center py-12"><div className="flex items-end gap-[3px] h-8">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.12}s ease-in-out infinite alternate`}}/>)}</div></div>
            : (
              <div className="pb-12">
                {activeTab==="posts"&&(
                  <div className="space-y-4">
                    {posts.length===0
                      ? <div className="text-center py-12"><div className="text-5xl mb-3">🎵</div><p className="text-zinc-400">No posts yet</p><p className="text-zinc-600 text-sm mt-1">Share your first musical moment!</p></div>
                      : posts.map(p=><PostCard key={p.id} post={p} user={profileUser}/>)
                    }
                  </div>
                )}
                {activeTab==="media"&&<MediaGrid posts={posts}/>}
                {activeTab==="about"&&(
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h3 className="font-['Bebas_Neue'] text-xl text-white">MUSICIAN <span className="text-amber-400">INFO</span></h3>
                    {[{icon:"✉️",label:"Email",value:profileUser.email},{icon:"📍",label:"Location",value:profileUser.location},{icon:"⏱️",label:"Experience",value:profileUser.experience?`${profileUser.experience} years`:null},{icon:"⭐",label:"Skill Level",value:profileUser.skillLevel},{icon:"📅",label:"Availability",value:profileUser.availability},{icon:"🗓️",label:"Member since",value:new Date(profileUser.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long"})}].filter(i=>i.value).map(({icon,label,value})=>(
                      <div key={label} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0"><span className="text-lg">{icon}</span><div><p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p><p className="text-white text-sm font-medium">{value}</p></div></div>
                    ))}
                  </div>
                )}
                {(activeTab==="followers"||activeTab==="following")&&(
                  <div className="space-y-3">
                    {!listsLoaded&&(
                      <div className="flex justify-center py-10">
                        <div className="flex items-end gap-[3px] h-8">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.1}s ease-in-out infinite alternate`}}/>)}</div>
                      </div>
                    )}
                    {listsLoaded&&(activeTab==="followers"?followers:following).length===0&&(
                      <div className="text-center py-14 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <div className="text-5xl mb-3">{activeTab==="followers"?"👥":"🎵"}</div>
                        <p className="text-zinc-400 font-medium">{activeTab==="followers"?"No followers yet":"Not following anyone yet"}</p>
                        <p className="text-zinc-600 text-sm mt-1">{activeTab==="followers"?"Share your profile to get followers":"Discover musicians and connect with them"}</p>
                      </div>
                    )}
                    {listsLoaded&&(activeTab==="followers"?followers:following).map((u,i)=>{
                      const fbStatus=followBackStatus[u.id];
                      const isFollowing=following.some(f=>f.id===u.id)||fbStatus==="following";
                      return(
                      <div key={u.id||i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 hover:border-zinc-700 transition-colors">
                        <Avatar user={u} size="md"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm">{u.firstName||""} {u.lastName||""}</p>
                          <p className="text-zinc-500 text-xs">@{u.username}</p>
                          {u.instruments?.length>0&&<p className="text-amber-400 text-xs mt-0.5">{u.instruments.slice(0,3).join(" · ")}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {u.skillLevel&&<span className="text-xs px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-400">{u.skillLevel.charAt(0)+u.skillLevel.slice(1).toLowerCase()}</span>}
                          {activeTab==="followers"&&(
                            isFollowing
                              ? <span className="text-xs text-emerald-400 border border-emerald-600/40 px-3 py-1 rounded-full">Following ✓</span>
                              : fbStatus==="requested"
                                ? <span className="text-xs text-zinc-400 border border-zinc-600 px-3 py-1 rounded-full">Requested ✓</span>
                                : <button onClick={()=>handleFollowBack(u.id)} disabled={!!followBackLoading[u.id]} className="text-xs text-amber-400 hover:bg-amber-400 hover:text-zinc-900 border border-amber-400/40 px-3 py-1 rounded-full transition-all font-semibold disabled:opacity-50">{followBackLoading[u.id]?"…":"Follow Back"}</button>
                          )}
                        </div>
                      </div>
                      );})}
                    ))}
                  </div>
                )}
              </div>
            )
          }
        </div>
      </div>
    </>
  );
}
