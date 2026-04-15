import { useState, useEffect, useCallback, useRef } from "react";
import toast from "./toast";
import ProfilePage from "./ProfilePage";
import OtherProfilePage from "./OtherProfilePage";
import MessagesPage from "./MessagesPage";
import AdminPage from "./AdminPage";
import BandsPage from "./BandsPage";
import MarketplacePage from "./MarketplacePage";
import LyricsPage from "./LyricsPage";
import ExplorePage from "./ExplorePage";
import SavedPostsPage from "./SavedPostsPage";

const API_BASE = "http://localhost:5000/api";
const MEDIA_BASE = "http://localhost:5000";
const token = () => localStorage.getItem("strumly_token");
const AVATAR_COLORS = ["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600","from-red-400 to-rose-600"];

// Helper: get first media item from post
const getMedia = (post) => post?.media?.[0] || null;

function timeAgo(d){const s=(Date.now()-new Date(d))/1000;if(s<60)return"just now";if(s<3600)return Math.floor(s/60)+"m";if(s<86400)return Math.floor(s/3600)+"h";return Math.floor(s/86400)+"d";}
function Avatar({user,size="md",ring=false}){const m={sm:"w-8 h-8 text-xs",md:"w-10 h-10 text-sm",lg:"w-14 h-14 text-base",xl:"w-20 h-20 text-xl"};const c=(user?.username||"").charCodeAt(0)%AVATAR_COLORS.length;const ring_cls=ring?"ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900":"";if(user?.profilePicture)return(<img src={`${MEDIA_BASE}${user.profilePicture}`} alt="" className={`${m[size]} rounded-full object-cover flex-shrink-0 ${ring_cls}`}/>);return(<div className={`${m[size]} rounded-full bg-gradient-to-br ${AVATAR_COLORS[c]} flex items-center justify-center font-bold text-white flex-shrink-0 ${ring_cls}`}>{((user?.firstName||user?.username||"?")[0]).toUpperCase()}</div>);}
function MusicBars({small}){return(<div className={`flex items-end gap-[2px] ${small?"h-4":"h-6"}`}>{[1,2,3,4,5].map(i=><div key={i} className={`${small?"w-[2px]":"w-[3px]"} bg-amber-400 rounded-full`} style={{height:`${20+i*8}%`,animation:`bb ${.6+i*.15}s ease-in-out infinite alternate`,animationDelay:`${i*.1}s`}}/>)}</div>);}

const Ic={
  Home:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  Search:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Users:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Music:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Msg:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Bell:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  UserI:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Plus:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Out:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Heart:({f})=><svg viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  Chat:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Send:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16,6 12,2 8,6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
  Img:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>,
  Vid:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  X:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Chk:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20,6 9,17 4,12"/></svg>,
  Del:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Bm:({f})=><svg viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
};
const SC={BEGINNER:"text-emerald-400",INTERMEDIATE:"text-blue-400",ADVANCED:"text-amber-400",PROFESSIONAL:"text-rose-400"};

function ConnectButton({targetUser,currentUser}){
  const [status,setStatus]=useState("NONE");
  const [loading,setLoading]=useState(false);
  const isReal=targetUser?.id&&!targetUser.id.startsWith("mock");
  const isSelf=targetUser?.id===currentUser?.id;
  useEffect(()=>{if(!isReal||isSelf)return;fetch(`${API_BASE}/follow/${targetUser.id}/status`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()).then(d=>{if(d.success)setStatus(d.data.status);}).catch(()=>{});},[targetUser?.id]);
  if(!isReal||isSelf)return<button className="text-xs text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full">Connect</button>;
  const click=async()=>{if(status!=="NONE")return;setLoading(true);try{const r=await fetch(`${API_BASE}/follow/${targetUser.id}/follow`,{method:"POST",headers:{Authorization:`Bearer ${token()}`}});const d=await r.json();if(d.success)setStatus("PENDING");}catch(e){}finally{setLoading(false);}};
  if(status==="PENDING")return<span className="text-xs text-zinc-400 border border-zinc-600 px-3 py-1 rounded-full">Requested ✓</span>;
  if(status==="ACCEPTED")return<span className="text-xs text-emerald-400 border border-emerald-600/40 px-3 py-1 rounded-full">Following ✓</span>;
  return<button onClick={click} disabled={loading} className="text-xs text-amber-400 hover:bg-amber-400 hover:text-zinc-900 border border-amber-400/40 px-3 py-1 rounded-full transition-all font-semibold disabled:opacity-50">{loading?"…":"Connect"}</button>;
}

// ─── Story Viewer — uses media[0] ─────────────────────────────────────────────
function StoryViewer({story,onClose}){
  const media = getMedia(story);
  return(
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-sm w-full mx-4" onClick={e=>e.stopPropagation()}>
        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <Avatar user={story.author} size="md" ring/>
            <div><p className="text-white text-sm font-semibold">{story.author.firstName} {story.author.lastName}</p><p className="text-zinc-500 text-xs">{timeAgo(story.createdAt)}</p></div>
            <button onClick={onClose} className="ml-auto text-zinc-400 hover:text-white"><Ic.X/></button>
          </div>
          {media && media.type==="VIDEO"
            ? <video src={`${MEDIA_BASE}${media.url}`} autoPlay loop className="w-full max-h-96 object-cover"/>
            : media
              ? <img src={`${MEDIA_BASE}${media.url}`} alt="" className="w-full max-h-96 object-cover"/>
              : <div className="h-64 bg-gradient-to-br from-amber-400/20 to-zinc-800 flex items-center justify-center p-6"><p className="text-white text-lg text-center">{story.content}</p></div>
          }
          {story.content && media && <p className="p-4 text-zinc-300 text-sm">{story.content}</p>}
        </div>
      </div>
    </div>
  );
}

function PostModal({user,onClose,onPost,isStory=false}){
  const [text,setText]=useState("");
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const fileRef=useRef();
  const handleFile=e=>{const f=e.target.files[0];if(!f)return;setFile(f);const r=new FileReader();r.onload=ev=>setPreview({url:ev.target.result,type:f.type.startsWith("video")?"video":"image"});r.readAsDataURL(f);};
  const submit=async()=>{
    if(!text.trim()&&!file){setError("Add text or media");return;}
    setLoading(true);setError("");
    try{
      const fd=new FormData();
      if(text.trim())fd.append("content",text);
      if(file)fd.append("media",file);
      const res=await fetch(`${API_BASE}/posts`,{method:"POST",headers:{Authorization:`Bearer ${token()}`},body:fd});
      const data=await res.json();
      if(!data.success)throw new Error(data.message);
      onPost(data.data);onClose();
    }catch(e){setError(e.message||"Failed to post");}
    finally{setLoading(false);}
  };
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-['Bebas_Neue'] text-xl text-white">{isStory?"ADD STORY":"CREATE POST"}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800"><Ic.X/></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3"><Avatar user={user} size="md" ring/><div><p className="text-white text-sm font-semibold">{user.firstName} {user.lastName}</p><p className="text-zinc-500 text-xs">@{user.username}</p></div></div>
          <textarea value={text} onChange={e=>setText(e.target.value)} autoFocus placeholder={isStory?"What's your story?":"Share a jam, find bandmates, post a gig…"} rows={3} className="w-full bg-transparent text-white text-sm placeholder-zinc-500 outline-none resize-none border-b border-zinc-800 pb-3"/>
          {preview&&(
            <div className="relative rounded-xl overflow-hidden bg-zinc-800">
              {preview.type==="video"?<video src={preview.url} controls className="w-full max-h-64 object-cover"/>:<img src={preview.url} alt="" className="w-full max-h-64 object-cover"/>}
              <button onClick={()=>{setFile(null);setPreview(null);}} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center"><Ic.X/></button>
            </div>
          )}
          {error&&<div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden"/>
              <button onClick={()=>fileRef.current.click()} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 border border-zinc-700 hover:border-amber-400/50 px-3 py-2 rounded-lg transition-all"><Ic.Img/> Photo</button>
              <button onClick={()=>fileRef.current.click()} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 border border-zinc-700 hover:border-amber-400/50 px-3 py-2 rounded-lg transition-all"><Ic.Vid/> Video</button>
            </div>
            <button onClick={submit} disabled={loading} className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-zinc-900 font-bold text-sm px-5 py-2 rounded-lg transition-all">{loading?"Posting…":isStory?"Share Story":"Post"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatePost({user,onPost}){
  const [show,setShow]=useState(false);
  return(
    <>
      {show&&<PostModal user={user} onClose={()=>setShow(false)} onPost={p=>{onPost(p);setShow(false);}}/>}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={()=>setShow(true)}>
          <Avatar user={user} size="md"/>
          <div className="flex-1 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-full px-4 py-2.5 text-sm text-zinc-500 transition-all">What's happening in your musical world?</div>
        </div>
        <div className="flex gap-3 mt-3 pt-3 border-t border-zinc-800">
          <button onClick={()=>setShow(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 flex-1 justify-center py-1.5 rounded-lg hover:bg-zinc-800 transition-all"><Ic.Img/> Photo</button>
          <button onClick={()=>setShow(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 flex-1 justify-center py-1.5 rounded-lg hover:bg-zinc-800 transition-all"><Ic.Vid/> Video</button>
          <button onClick={()=>setShow(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 flex-1 justify-center py-1.5 rounded-lg hover:bg-zinc-800 transition-all"><MusicBars small/><span className="ml-1">Post</span></button>
        </div>
      </div>
    </>
  );
}

// ─── PostCard — uses post.media[0] instead of post.mediaUrl ──────────────────
function PostCard({post,currentUser,onAvatarClick,onDelete}){
  const [liked,setLiked]=useState(!!post.isLiked);
  const [likes,setLikes]=useState(post._count?.likes||0);
  const [saved,setSaved]=useState(!!post.isSaved);
  const [showC,setShowC]=useState(false);
  const [comments,setComments]=useState([]);
  const [comment,setComment]=useState("");
  const [loadingC,setLoadingC]=useState(false);
  const [submittingC,setSubmittingC]=useState(false);
  const isSelf=post.author?.id===currentUser?.id;
  const isReal=!post.id.startsWith("m");
  const media=getMedia(post); // ← use media[0]

  const toggleLike=async()=>{
    setLiked(l=>!l);
    setLikes(c=>liked?c-1:c+1);
    if(isReal){
      const r=await fetch(`${API_BASE}/posts/${post.id}/like`,{method:"POST",headers:{Authorization:`Bearer ${token()}`}}).catch(()=>{});
      if(r){const d=await r.json();if(d.success)setLikes(d.likes);}
    }
  };
  const toggleBookmark=async()=>{setSaved(s=>!s);if(isReal){try{await fetch(`${API_BASE}/bookmarks/${post.id}`,{method:"POST",headers:{Authorization:`Bearer ${token()}`}});}catch(e){setSaved(s=>!s);}}};
  const loadComments=async()=>{if(!isReal)return;setLoadingC(true);try{const r=await fetch(`${API_BASE}/posts/${post.id}/comments`,{headers:{Authorization:`Bearer ${token()}`}});const d=await r.json();if(d.success)setComments(d.data);}catch(e){}finally{setLoadingC(false);}};
  const submitComment=async()=>{if(!comment.trim()||!isReal||submittingC)return;setSubmittingC(true);try{const r=await fetch(`${API_BASE}/posts/${post.id}/comment`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token()}`},body:JSON.stringify({content:comment})});const d=await r.json();if(d.success){setComments(c=>[...c,d.data]);setComment("");}else{toast.error(d.message||"Failed to post comment");}}catch(e){toast.error("Failed to post comment");}finally{setSubmittingC(false);}};

  return(
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={()=>!isSelf&&onAvatarClick&&onAvatarClick(post.author)}>
          <Avatar user={post.author} size="md" ring/>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold hover:text-amber-400 transition-colors">{post.author.firstName} {post.author.lastName}</span>
              <span className={`text-xs ${SC[post.author.skillLevel]||"text-zinc-400"}`}>{post.author.skillLevel?.toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-1.5"><span className="text-zinc-500 text-xs">@{post.author.username}</span><span className="text-zinc-700">·</span><span className="text-zinc-500 text-xs">{timeAgo(post.createdAt)}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(post.author.instruments||[]).slice(0,1).map(ins=><span key={ins} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-amber-400">{ins}</span>)}
          {isSelf&&isReal&&onDelete&&<button onClick={()=>onDelete(post.id)} className="text-zinc-600 hover:text-red-400 transition-colors"><Ic.Del/></button>}
        </div>
      </div>

      {post.content&&<div className="px-4 pb-3"><p className="text-zinc-200 text-sm leading-relaxed">{post.content}</p></div>}

      {/* ── Media: read from media[0] ── */}
      {media && (
        <div className="bg-zinc-800">
          {media.type==="VIDEO"
            ? <video src={`${MEDIA_BASE}${media.url}`} controls className="w-full max-h-96 object-cover"/>
            : <img src={`${MEDIA_BASE}${media.url}`} alt="" className="w-full max-h-96 object-cover"/>
          }
        </div>
      )}
      {!media&&<div className="px-4 pb-3"><div className="flex items-end gap-[2px] h-7 opacity-20">{Array.from({length:60},(_,i)=><div key={i} className="flex-1 bg-amber-400 rounded-sm" style={{height:`${10+Math.sin(i*0.4)*40+Math.random()*20}%`}}/>)}</div></div>}

      <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked?"text-rose-400":"text-zinc-400 hover:text-rose-400"}`}><Ic.Heart f={liked}/><span>{likes}</span></button>
            <button onClick={()=>{if(!showC)loadComments();setShowC(s=>!s);}} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-amber-400 transition-colors"><Ic.Chat/><span>{post._count?.comments||comments.length||0}</span></button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleBookmark} className={`transition-colors ${saved?"text-amber-400":"text-zinc-400 hover:text-amber-400"}`}><Ic.Bm f={saved}/></button>
            {!isSelf&&<ConnectButton targetUser={post.author} currentUser={currentUser}/>}
          </div>
        </div>
        {showC&&(
          <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
            {loadingC&&<p className="text-zinc-500 text-xs text-center">Loading…</p>}
            {comments.map(c=>{const cu=c.user||c.author;return(
              <div key={c.id} className="flex gap-2">
                <Avatar user={cu||currentUser} size="sm"/>
                <div className="flex-1 bg-zinc-800 rounded-xl px-3 py-2">
                  <span className="text-white text-xs font-semibold">{cu?.firstName||cu?.username||"User"}</span>
                  <p className="text-zinc-300 text-xs mt-0.5">{c.content}</p>
                </div>
              </div>
            );})}
            <div className="flex gap-2">
              <Avatar user={currentUser} size="sm"/>
              <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitComment()} placeholder="Add a comment…" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"/>
              <button onClick={submitComment} disabled={!comment.trim()||submittingC} className="text-xs text-amber-400 font-semibold px-2 disabled:opacity-40">{submittingC?"…":"Post"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stories — uses media[0] ──────────────────────────────────────────────────
function Stories({currentUser,stories,onAddStory}){
  const [viewing,setViewing]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  return(
    <>
      {viewing&&<StoryViewer story={viewing} onClose={()=>setViewing(null)}/>}
      {showAdd&&<PostModal user={currentUser} isStory onClose={()=>setShowAdd(false)} onPost={s=>{onAddStory(s);setShowAdd(false);}}/>}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="relative cursor-pointer" onClick={()=>setShowAdd(true)}>
              <div className="p-[2px] rounded-full border-2 border-dashed border-amber-400/60"><div className="bg-zinc-900 p-[2px] rounded-full"><Avatar user={currentUser} size="lg"/></div></div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center"><span className="text-zinc-900 text-xs font-bold">+</span></div>
            </div>
            <span className="text-xs text-zinc-400 truncate max-w-[56px] text-center">Your story</span>
          </div>
          {stories.map((s,i)=>(
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group" onClick={()=>setViewing(s)}>
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 to-orange-500"><div className="bg-zinc-900 p-[2px] rounded-full"><Avatar user={s.author} size="lg"/></div></div>
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 truncate max-w-[56px] text-center">{s.author?.username}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const NOTIF_ICONS={
  FOLLOW:"👤", FOLLOW_ACCEPTED:"✅", POST_LIKE:"❤️", POST_COMMENT:"💬",
  BAND_JOIN_REQUEST:"🎸", BAND_REQUEST_ACCEPTED:"🎉", BAND_REQUEST_REJECTED:"❌"
};

function NotificationsTab(){
  const [notifications,setNotifications]=useState([]);
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [actioned,setActioned]=useState({});
  const [tab,setTab]=useState("all");

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const [nr,nf]=await Promise.all([
        fetch(`${API_BASE}/notifications`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()),
        fetch(`${API_BASE}/follow/requests/pending`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()),
      ]);
      if(nr.success)setNotifications(nr.data);
      if(nf.success)setRequests(nf.data);
    }catch{}finally{setLoading(false);}
  },[]);

  useEffect(()=>{load();},[load]);

  const markRead=async id=>{
    await fetch(`${API_BASE}/notifications/${id}/read`,{method:"PATCH",headers:{Authorization:`Bearer ${token()}`}}).catch(()=>{});
    setNotifications(n=>n.map(x=>x.id===id?{...x,read:true}:x));
  };
  const markAll=async()=>{
    await fetch(`${API_BASE}/notifications/read-all`,{method:"PATCH",headers:{Authorization:`Bearer ${token()}`}}).catch(()=>{});
    setNotifications(n=>n.map(x=>({...x,read:true})));
  };
  const accept=async req=>{const r=await fetch(`${API_BASE}/follow/${req.id}/accept`,{method:"POST",headers:{Authorization:`Bearer ${token()}`}});const d=await r.json();if(d.success){setActioned(a=>({...a,[req.id]:"accepted"}));load();}};
  const decline=async req=>{const r=await fetch(`${API_BASE}/follow/${req.id}/decline`,{method:"POST",headers:{Authorization:`Bearer ${token()}`}});const d=await r.json();if(d.success)setActioned(a=>({...a,[req.id]:"declined"}));};

  const unread=notifications.filter(n=>!n.read).length;
  const pending=requests.filter(r=>!actioned[r.id]).length;

  return(
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-['Bebas_Neue'] text-2xl text-white">NOTIFICATIONS{unread>0&&<span className="text-amber-400 ml-2">({unread})</span>}</h2>
        <div className="flex gap-2">
          {unread>0&&<button onClick={markAll} className="text-xs text-amber-400 border border-amber-400/30 px-3 py-1.5 rounded-lg hover:bg-amber-400/10 transition-all">Mark all read</button>}
          <button onClick={load} className="text-xs text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded-lg hover:text-zinc-300 transition-all">Refresh</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={()=>setTab("all")} className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${tab==="all"?"bg-amber-400 text-zinc-900":"border border-zinc-700 text-zinc-400 hover:text-white"}`}>All {notifications.length>0&&`(${notifications.length})`}</button>
        <button onClick={()=>setTab("requests")} className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${tab==="requests"?"bg-amber-400 text-zinc-900":"border border-zinc-700 text-zinc-400 hover:text-white"}`}>Follow Requests {pending>0&&`(${pending})`}</button>
      </div>

      {loading&&<div className="flex justify-center py-8"><div className="flex items-end gap-[3px] h-6">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.1}s ease-in-out infinite alternate`}}/>)}</div></div>}

      {/* All Notifications */}
      {!loading&&tab==="all"&&(
        <div className="space-y-2">
          {notifications.length===0&&<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center"><div className="text-4xl mb-3">🔔</div><p className="text-zinc-400">No notifications yet</p><p className="text-zinc-600 text-sm mt-1">Activity from followers and posts will appear here</p></div>}
          {notifications.map(n=>(
            <div key={n.id} onClick={()=>!n.read&&markRead(n.id)} className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-zinc-700 ${!n.read?"border-amber-400/30 bg-amber-400/5":"border-zinc-800"}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg flex-shrink-0">{NOTIF_ICONS[n.type]||"🔔"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {n.actor&&<Avatar user={n.actor} size="sm"/>}
                    <p className="text-sm text-zinc-200 leading-snug">{n.message}</p>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read&&<div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"/>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Follow Requests */}
      {!loading&&tab==="requests"&&(
        <div className="space-y-3">
          {requests.filter(r=>!actioned[r.id]).length===0&&<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center"><div className="text-4xl mb-3">👥</div><p className="text-zinc-400">No pending follow requests</p></div>}
          {requests.map(req=>{const done=actioned[req.id];return(
            <div key={req.id} className={`bg-zinc-900 border rounded-xl p-4 transition-all ${done?"border-zinc-800 opacity-60":"border-zinc-800 hover:border-zinc-700"}`}>
              <div className="flex items-center gap-3">
                <Avatar user={req.follower} size="md" ring/>
                <div className="flex-1"><p className="text-white text-sm"><span className="font-semibold">{req.follower.firstName||req.follower.username} {req.follower.lastName||""}</span> <span className="text-zinc-400">wants to follow you</span></p><p className="text-zinc-500 text-xs">@{req.follower.username}{req.follower.instruments?.length>0&&` · ${req.follower.instruments.slice(0,2).join(", ")}`}</p></div>
                {!done?(<div className="flex gap-2"><button onClick={()=>accept(req)} className="flex items-center gap-1.5 text-xs text-zinc-900 font-bold bg-amber-400 hover:bg-amber-300 px-3 py-2 rounded-lg"><Ic.Chk/>Accept</button><button onClick={()=>decline(req)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500 px-3 py-2 rounded-lg"><Ic.X/>Decline</button></div>):(<span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${done==="accepted"?"text-emerald-400 bg-emerald-400/10":"text-zinc-500 bg-zinc-800"}`}>{done==="accepted"?"Accepted ✓":"Declined"}</span>)}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

const DISC_INSTRUMENTS=["Guitar","Bass","Drums","Piano","Vocals","Violin","Saxophone","Trumpet","Keys","DJ","Ukulele","Flute"];
const DISC_GENRES=["Rock","Jazz","Pop","Metal","Blues","Classical","Hip-Hop","Electronic","Folk","Indie","R&B","Reggae"];
const DISC_SKILLS=["BEGINNER","INTERMEDIATE","ADVANCED","PROFESSIONAL"];

function DiscoverTab({currentUser,onUserClick}){
  const [query,setQuery]=useState("");
  const [instrument,setInstrument]=useState("");
  const [genre,setGenre]=useState("");
  const [skill,setSkill]=useState("");
  const [location,setLocation]=useState("");
  const [results,setResults]=useState([]);
  const [allUsers,setAllUsers]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const [showFilters,setShowFilters]=useState(false);

  useEffect(()=>{
    fetch(`${API_BASE}/users`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()).then(d=>{if(d.data)setAllUsers(d.data.filter(u=>u.id!==currentUser.id));}).catch(()=>{});
  },[]);

  const search=async()=>{
    setLoading(true);setSearched(true);
    try{
      const params=new URLSearchParams();
      if(query.trim())params.set("name",query);
      if(instrument)params.set("instrument",instrument);
      if(genre)params.set("genre",genre);
      if(skill)params.set("skillLevel",skill);
      if(location.trim())params.set("location",location);
      const r=await fetch(`${API_BASE}/users/search?${params}`,{headers:{Authorization:`Bearer ${token()}`}});
      const d=await r.json();
      setResults((d.data||[]).filter(u=>u.id!==currentUser.id));
    }catch{setResults([]);}finally{setLoading(false);}
  };

  const reset=()=>{setQuery("");setInstrument("");setGenre("");setSkill("");setLocation("");setSearched(false);setResults([]);};
  const display=searched?results:allUsers;
  const hasFilters=instrument||genre||skill||location.trim();

  return(
    <div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-3">DISCOVER <span className="text-amber-400">MUSICIANS</span></h2>
        <div className="flex gap-2 mb-3">
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Search by name or username…" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"/>
          <button onClick={()=>setShowFilters(f=>!f)} className={`border px-3 py-2.5 rounded-lg text-sm transition-all ${showFilters||hasFilters?"border-amber-400 text-amber-400 bg-amber-400/10":"border-zinc-700 text-zinc-400 hover:text-white"}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/></svg>
          </button>
          <button onClick={search} className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-4 py-2.5 rounded-lg">Search</button>
        </div>
        {showFilters&&(
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800">
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Instrument</label>
              <select value={instrument} onChange={e=>setInstrument(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400">
                <option value="">Any</option>{DISC_INSTRUMENTS.map(i=><option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Genre</label>
              <select value={genre} onChange={e=>setGenre(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400">
                <option value="">Any</option>{DISC_GENRES.map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Skill Level</label>
              <select value={skill} onChange={e=>setSkill(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-400">
                <option value="">Any</option>{DISC_SKILLS.map(s=><option key={s} value={s}>{s.charAt(0)+s.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Location</label>
              <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, Country" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>
            </div>
            {hasFilters&&<button onClick={reset} className="col-span-2 text-xs text-zinc-500 hover:text-white text-center py-1 transition-colors">Clear filters</button>}
          </div>
        )}
      </div>
      {loading&&<div className="text-center text-zinc-500 py-8">Searching…</div>}
      {!loading&&searched&&results.length===0&&<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center"><div className="text-4xl mb-3">🎵</div><p className="text-zinc-400">No musicians found</p><p className="text-zinc-600 text-sm mt-1">Try different filters</p></div>}
      <div className="grid grid-cols-2 gap-3">{display.map((m,i)=>(
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="cursor-pointer" onClick={()=>onUserClick(m)}><Avatar user={m} size="lg" ring/></div>
            <div className="cursor-pointer" onClick={()=>onUserClick(m)}><p className="text-white text-sm font-semibold hover:text-amber-400 transition-colors">{m.firstName} {m.lastName}</p><p className="text-zinc-500 text-xs">@{m.username}</p></div>
            {m.skillLevel&&<span className={`text-xs font-medium ${SC[m.skillLevel]}`}>{m.skillLevel.charAt(0)+m.skillLevel.slice(1).toLowerCase()}</span>}
            {m.location&&<p className="text-zinc-600 text-xs">📍 {m.location}</p>}
            <div className="flex flex-wrap justify-center gap-1">{m.instruments?.slice(0,3).map(ins=><span key={ins} className="text-xs px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-amber-400">{ins}</span>)}</div>
            <ConnectButton targetUser={m} currentUser={currentUser}/>
          </div>
        </div>
      ))}</div>
    </div>
  );
}

function LeftSidebar({user,activeTab,setActiveTab,onLogout,onProfile,pendingCount,onNewPost,onAdmin}){
  const nav=[{id:"home",label:"Home",icon:<Ic.Home/>},{id:"search",label:"Discover",icon:<Ic.Search/>},{id:"messages",label:"Messages",icon:<Ic.Msg/>},{id:"bands",label:"Bands",icon:<Ic.Users/>},{id:"marketplace",label:"Marketplace",icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>},{id:"saved",label:"Saved Posts",icon:<Ic.Bm f={false}/>},{id:"feed",label:"Jam Feed",icon:<Ic.Music/>},{id:"notifications",label:"Notifications",icon:<Ic.Bell/>,badge:pendingCount},{id:"lyrics",label:"AI Lyrics",icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>}];
  return(
    <div className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 border-r border-zinc-800 bg-zinc-950 px-4 py-6">
      <div className="flex items-center gap-3 mb-10 px-2"><MusicBars/><span className="font-['Bebas_Neue'] text-2xl tracking-widest text-white">STRUMLY</span></div>
      <nav className="flex-1 space-y-1">{nav.map(item=><button key={item.id} onClick={()=>setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab===item.id?"bg-amber-400/10 text-amber-400 border border-amber-400/20":"text-zinc-400 hover:text-white hover:bg-zinc-800"}`}>{item.icon}{item.label}{item.badge>0&&<span className="ml-auto w-5 h-5 bg-amber-400 text-zinc-900 text-xs font-bold rounded-full flex items-center justify-center">{item.badge}</span>}</button>)}
      {user?.role==="ADMIN"&&<button onClick={onAdmin} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all text-rose-400 hover:bg-rose-400/10 border border-rose-400/20 mt-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Admin Panel</button>}
      </nav>
      <button onClick={onNewPost} className="flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm py-3 rounded-xl transition-all mb-6"><Ic.Plus/>New Post</button>
      <div onClick={onProfile} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-zinc-800 transition-all cursor-pointer group"><Avatar user={user} size="md"/><div className="flex-1 min-w-0"><p className="text-white text-sm font-semibold truncate">{user.firstName||user.username}</p><p className="text-zinc-500 text-xs truncate">@{user.username}</p></div><button onClick={e=>{e.stopPropagation();onLogout();}} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"><Ic.Out/></button></div>
    </div>
  );
}

function RightSidebar({user,onProfile,onUserClick}){
  const [realUsers,setRealUsers]=useState([]);
  useEffect(()=>{fetch(`${API_BASE}/users`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()).then(d=>{if(d.data?.length>0)setRealUsers(d.data.filter(u=>u.id!==user.id).slice(0,4));}).catch(()=>{});},[]);
  return(
    <div className="hidden xl:flex flex-col w-80 h-screen sticky top-0 px-4 py-6 space-y-6 overflow-y-auto">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onProfile}><Avatar user={user} size="md" ring/><div className="flex-1"><p className="text-white text-sm font-semibold group-hover:text-amber-400">{user.firstName} {user.lastName}</p><p className="text-zinc-500 text-xs">@{user.username}</p></div><button className="text-xs text-amber-400 hover:underline">Profile</button></div>
      {realUsers.length>0&&<div><span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 block mb-4">Suggested Musicians</span><div className="space-y-4">{realUsers.map((m,i)=><div key={i} className="flex items-center gap-3"><div className="cursor-pointer" onClick={()=>onUserClick(m)}><Avatar user={m} size="md"/></div><div className="flex-1 min-w-0 cursor-pointer" onClick={()=>onUserClick(m)}><p className="text-white text-sm font-medium truncate hover:text-amber-400">{m.firstName} {m.lastName}</p><p className="text-zinc-500 text-xs truncate">{m.instruments?.join(", ")}</p></div><ConnectButton targetUser={m} currentUser={user}/></div>)}</div></div>}
      <div><span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 block mb-4">Trending Now</span><div className="space-y-3">{[["#Guitar",234],["#JamSession",187],["#BandWanted",142],["#Jazz",98],["#HomeStudio",76]].map(([t,c])=><div key={t} className="flex items-center justify-between cursor-pointer group"><div><p className="text-white text-sm font-medium group-hover:text-amber-400">{t}</p><p className="text-zinc-500 text-xs">{c} posts</p></div><MusicBars small/></div>)}</div></div>
    </div>
  );
}

function MobileNav({activeTab,setActiveTab,onProfile,pendingCount,onMessages}){
  return(<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around py-3 z-50">{[{id:"home",icon:<Ic.Home/>},{id:"search",icon:<Ic.Search/>},{id:"messages",icon:<Ic.Msg/>,action:onMessages},{id:"notifications",icon:<Ic.Bell/>,badge:pendingCount},{id:"profile",icon:<Ic.UserI/>,action:onProfile}].map(item=><button key={item.id} onClick={item.action||(()=>setActiveTab(item.id))} className={`relative p-2 rounded-lg transition-colors ${activeTab===item.id?"text-amber-400":"text-zinc-500"}`}>{item.icon}{item.badge>0&&<span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 text-zinc-900 text-[10px] font-bold rounded-full flex items-center justify-center">{item.badge}</span>}</button>)}</div>);
}

export default function HomePage({user,onLogout}){
  const [currentUser,setCurrentUser]=useState(user);
  const [activeTab,setActiveTab]=useState("home");
  const [view,setView]=useState({type:"home"});
  const [posts,setPosts]=useState([]);
  const [stories,setStories]=useState([]);
  const [loadingPosts,setLoadingPosts]=useState(true);
  const [loadingMore,setLoadingMore]=useState(false);
  const [page,setPage]=useState(1);
  const [hasMore,setHasMore]=useState(true);
  const [pendingCount,setPendingCount]=useState(0);
  const [unreadMsgCount,setUnreadMsgCount]=useState(0);
  const [showNewPost,setShowNewPost]=useState(false);
  const loaderRef=useRef(null);

  useEffect(()=>{
    const load=()=>{
      fetch(`${API_BASE}/follow/requests/pending`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()).then(d=>{if(d.success)setPendingCount(d.data.length);}).catch(()=>{});
      fetch(`${API_BASE}/messages/unread-count`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()).then(d=>{if(d.success)setUnreadMsgCount(d.count);}).catch(()=>{});
      fetch(`${API_BASE}/notifications/unread-count`,{headers:{Authorization:`Bearer ${token()}`}}).then(r=>r.json()).then(d=>{if(d.success)setPendingCount(c=>c+d.count);}).catch(()=>{});
    };
    load();const iv=setInterval(load,30000);return()=>clearInterval(iv);
  },[]);

  const LIMIT=10;

  const loadFeed=useCallback(async(pageNum=1)=>{
    if(pageNum===1)setLoadingPosts(true); else setLoadingMore(true);
    try{
      const pr=await fetch(`${API_BASE}/posts/feed?page=${pageNum}&limit=${LIMIT}`,{headers:{Authorization:`Bearer ${token()}`}});
      const pd=await pr.json();
      if(pd.success){
        const newPosts=pd.data;
        if(pageNum===1){
          setPosts(newPosts.length>0?newPosts:MOCK_POSTS);
          setStories(newPosts.filter(p=>getMedia(p)).slice(0,10));
        }else{
          setPosts(p=>[...p,...newPosts]);
        }
        setHasMore(newPosts.length===LIMIT);
      }else if(pageNum===1){setPosts(MOCK_POSTS);}
    }catch{if(pageNum===1)setPosts(MOCK_POSTS);}
    finally{setLoadingPosts(false);setLoadingMore(false);}
  },[]);

  useEffect(()=>{loadFeed(1);},[loadFeed]);

  useEffect(()=>{
    if(!loaderRef.current)return;
    const obs=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting&&hasMore&&!loadingMore&&!loadingPosts){
        setPage(p=>{const next=p+1;loadFeed(next);return next;});
      }
    },{threshold:1.0});
    obs.observe(loaderRef.current);
    return()=>obs.disconnect();
  },[hasMore,loadingMore,loadingPosts,loadFeed]);

  const handleNewPost=post=>{setPosts(p=>[post,...p]);if(getMedia(post))setStories(s=>[post,...s]);};
  const handleDelete=async id=>{if(!window.confirm("Delete this post?"))return;try{await fetch(`${API_BASE}/posts/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token()}`}});setPosts(p=>p.filter(post=>post.id!==id));}catch(e){alert("Failed to delete");}};
  const handleUserUpdate=u=>{setCurrentUser(u);localStorage.setItem("strumly_user",JSON.stringify(u));};

  const CSS=`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box}body{margin:0;font-family:'DM Sans',sans-serif;background:#09090b}@keyframes bb{from{transform:scaleY(.3);opacity:.5}to{transform:scaleY(1);opacity:1}}.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`;

  if(view.type==="myProfile")return(<><style>{CSS}</style><ProfilePage user={currentUser} onUserUpdate={handleUserUpdate} onBack={()=>setView({type:"home"})}/></>);
  if(view.type==="otherProfile")return(<><style>{CSS}</style><OtherProfilePage userId={view.userId} currentUser={currentUser} onBack={()=>setView({type:"home"})}/></>);
  if(view.type==="messages")return(<><style>{CSS}</style><MessagesPage currentUser={currentUser} onBack={()=>setView({type:"home"})} contactUser={view.contactUser}/></>);
  if(view.type==="admin")return(<><style>{CSS}</style><AdminPage currentUser={currentUser} onBack={()=>setView({type:"home"})}/></>);
  if(view.type==="bands")return(<><style>{CSS}</style><BandsPage currentUser={currentUser} onBack={()=>setView({type:"home"})}/></>);
  if(view.type==="marketplace")return(<><style>{CSS}</style><MarketplacePage currentUser={currentUser} onBack={()=>setView({type:"home"})} onMessage={seller=>setView({type:"messages",contactUser:seller})}/></>);
  if(view.type==="lyrics")return(<><style>{CSS}</style><LyricsPage onBack={()=>setView({type:"home"})}/></>);
  if(view.type==="explore")return(<><style>{CSS}</style><ExplorePage onBack={()=>setView({type:"home"})}/></>);
  if(view.type==="saved")return(<><style>{CSS}</style><div className="min-h-screen bg-zinc-950"><button onClick={()=>setView({type:"home"})} className="fixed top-4 left-4 text-zinc-400 hover:text-white z-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">← Back</button><SavedPostsPage/></div></>);

  return(
    <>
      <style>{CSS}</style>
      {showNewPost&&<PostModal user={currentUser} onClose={()=>setShowNewPost(false)} onPost={p=>{handleNewPost(p);setShowNewPost(false);}}/>}
      <div className="min-h-screen bg-zinc-950 text-white flex">
        <LeftSidebar user={currentUser} activeTab={activeTab} setActiveTab={tab=>{if(tab==="messages"){setView({type:"messages"});return;}if(tab==="bands"){setView({type:"bands"});return;}if(tab==="marketplace"){setView({type:"marketplace"});return;}if(tab==="lyrics"){setView({type:"lyrics"});return;}if(tab==="explore"){setView({type:"explore"});return;}if(tab==="saved"){setView({type:"saved"});return;}setActiveTab(tab);}} onLogout={onLogout} onProfile={()=>setView({type:"myProfile"})} pendingCount={pendingCount} onNewPost={()=>setShowNewPost(true)} onAdmin={()=>setView({type:"admin"})}/>
        <main className="flex-1 min-h-screen overflow-y-auto pb-20 lg:pb-6">
          <div className="max-w-xl mx-auto px-4 pt-6">
            <div className="lg:hidden flex items-center justify-between mb-6"><div className="flex items-center gap-2"><MusicBars small/><span className="font-['Bebas_Neue'] text-xl tracking-widest">STRUMLY</span></div><button onClick={onLogout} className="text-zinc-500 hover:text-red-400"><Ic.Out/></button></div>
            {activeTab==="home"&&(<>
              <Stories currentUser={currentUser} stories={stories} onAddStory={handleNewPost}/>
              <CreatePost user={currentUser} onPost={handleNewPost}/>
              {loadingPosts
                ? <div className="space-y-4">{[1,2,3].map(i=><div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-zinc-800"/><div className="flex-1 space-y-2"><div className="h-3 bg-zinc-800 rounded w-32"/><div className="h-2 bg-zinc-800 rounded w-24"/></div></div><div className="space-y-2"><div className="h-3 bg-zinc-800 rounded w-full"/><div className="h-3 bg-zinc-800 rounded w-4/5"/></div><div className="h-40 bg-zinc-800 rounded-lg mt-4"/></div>)}</div>
                : posts.length===0
                  ? <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl"><div className="text-5xl mb-3">🎵</div><p className="text-zinc-300 font-semibold text-lg">Your feed is empty</p><p className="text-zinc-500 text-sm mt-1 mb-5">Follow musicians to see their posts here</p><button onClick={()=>setActiveTab("search")} className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-6 py-2.5 rounded-xl transition-all">Discover Musicians</button></div>
                  : posts.map(post=><PostCard key={post.id} post={post} currentUser={currentUser} onAvatarClick={u=>u?.id&&!u.id.startsWith("mock")&&setView({type:"otherProfile",userId:u.id})} onDelete={handleDelete}/>)
              }
              <div ref={loaderRef} className="py-4 flex justify-center">
                {loadingMore&&<div className="flex items-end gap-[3px] h-6">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.12}s ease-in-out infinite alternate`}}/>)}</div>}
                {!hasMore&&!loadingPosts&&posts.length>0&&<p className="text-zinc-600 text-xs">You're all caught up</p>}
              </div>
            </>)}
            {activeTab==="search"&&<DiscoverTab currentUser={currentUser} onUserClick={u=>setView({type:"otherProfile",userId:u.id})}/>}
            {activeTab==="bands"&&<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center"><h2 className="font-['Bebas_Neue'] text-3xl text-white mb-2">BANDS & <span className="text-amber-400">COLLABS</span></h2><p className="text-zinc-400 text-sm mb-4">Browse bands looking for members.</p><button className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-6 py-2.5 rounded-lg">Coming Soon</button></div>}
            {activeTab==="feed"&&<div><div className="flex items-center gap-3 mb-4"><MusicBars/><h2 className="font-['Bebas_Neue'] text-2xl text-white">JAM <span className="text-amber-400">FEED</span></h2></div>{posts.map(post=><PostCard key={post.id} post={post} currentUser={currentUser} onAvatarClick={u=>u?.id&&!u.id.startsWith("mock")&&setView({type:"otherProfile",userId:u.id})} onDelete={handleDelete}/>)}</div>}
            {activeTab==="notifications"&&<NotificationsTab/>}
          </div>
        </main>
        <RightSidebar user={currentUser} onProfile={()=>setView({type:"myProfile"})} onUserClick={u=>setView({type:"otherProfile",userId:u.id})}/>
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onProfile={()=>setView({type:"myProfile"})} pendingCount={pendingCount} onMessages={()=>setView({type:"messages"})}/>
      </div>
    </>
  );
}
