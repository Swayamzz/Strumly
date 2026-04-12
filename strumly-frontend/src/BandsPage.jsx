import { useState, useEffect, useCallback } from "react";
import toast from "./toast";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("strumly_token");
const h = () => ({ Authorization: `Bearer ${token()}` });
const hj = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

const GENRES = ["Rock","Pop","Jazz","Classical","Hip-Hop","R&B","Electronic","Folk","Metal","Indie","Blues","Country","Reggae","Punk","Soul"];
const INSTRUMENTS = ["Guitar","Bass","Drums","Piano","Vocals","Violin","Saxophone","Trumpet","Keyboard","Ukulele","Cello","Flute","Synthesizer","Banjo"];
const AVATAR_COLORS = ["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600"];
const SKILL_COLORS = { BEGINNER:"text-emerald-400", INTERMEDIATE:"text-blue-400", ADVANCED:"text-amber-400", PROFESSIONAL:"text-rose-400" };

function Avatar({ name, picture, size = "md" }) {
  const s = { sm:"w-8 h-8 text-xs", md:"w-10 h-10 text-sm", lg:"w-14 h-14 text-lg" };
  const c = (name||"?").charCodeAt(0) % AVATAR_COLORS.length;
  if(picture) return <img src={`${MEDIA_BASE}${picture}`} alt="" className={`${s[size]} rounded-full object-cover flex-shrink-0`}/>;
  return <div className={`${s[size]} rounded-full bg-gradient-to-br ${AVATAR_COLORS[c]} flex items-center justify-center font-bold text-white flex-shrink-0`}>{(name||"?")[0].toUpperCase()}</div>;
}

const MEDIA_BASE = "http://localhost:5000";
function BandAvatar({ name, picture, size = "md" }) {
  const s = { sm:"w-8 h-8 text-xs", md:"w-12 h-12 text-base", lg:"w-20 h-20 text-2xl", xl:"w-24 h-24 text-3xl" };
  if(picture) return <img src={picture.startsWith("http")?picture:`${MEDIA_BASE}${picture}`} alt="" className={`${s[size]} rounded-2xl object-cover flex-shrink-0`}/>;
  return <div className={`${s[size]} rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center font-bold text-zinc-900 flex-shrink-0`}>{(name||"?")[0].toUpperCase()}</div>;
}

function Badge({ label, color = "amber" }) {
  const c = { amber:"bg-amber-400/10 text-amber-400 border-amber-400/30", violet:"bg-violet-400/10 text-violet-400 border-violet-400/30", rose:"bg-rose-400/10 text-rose-400 border-rose-400/30", zinc:"bg-zinc-700 text-zinc-300 border-zinc-600" };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${c[color]}`}>{label}</span>;
}

function Loader() {
  return <div className="flex justify-center py-16"><div className="flex items-end gap-[3px] h-8">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.1}s ease-in-out infinite alternate`}}/>)}</div></div>;
}

// ── CREATE BAND MODAL ─────────────────────────────────────────────────────────
function CreateBandModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name:"", description:"", location:"", genre:[], lookingFor:[] });
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = (field, val) => setForm(f => ({
    ...f, [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val]
  }));
  const handlePic = e => { const f=e.target.files[0]; if(!f)return; setPicFile(f); setPicPreview(URL.createObjectURL(f)); };

  const submit = async () => {
    if (!form.name.trim()) { setError("Band name is required"); return; }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if(form.description) fd.append("description", form.description);
      if(form.location) fd.append("location", form.location);
      form.genre.forEach(g => fd.append("genre", g));
      form.lookingFor.forEach(i => fd.append("lookingFor", i));
      if(picFile) fd.append("profilePicture", picFile);
      const res = await fetch(`${API}/bands`, { method:"POST", headers:h(), body:fd }).then(r=>r.json());
      if (res.success) { onCreate(res.data); onClose(); }
      else setError(res.message);
    } catch { setError("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h2 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">CREATE A <span className="text-amber-400">BAND</span></h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-rose-400 text-sm bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-2">{error}</p>}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              {picPreview ? <img src={picPreview} alt="" className="w-20 h-20 rounded-2xl object-cover"/> : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-zinc-900 font-bold text-2xl">{form.name?form.name[0].toUpperCase():"♪"}</div>}
              <label className="absolute -bottom-2 -right-2 bg-amber-400 hover:bg-amber-300 text-zinc-900 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <input type="file" accept="image/*" onChange={handlePic} className="hidden"/>
              </label>
            </div>
            <p className="text-zinc-500 text-xs">Band photo (optional)</p>
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">Band Name *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Enter band name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Tell musicians about your band…" rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 resize-none"/>
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">Location</label>
            <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="City, Country"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-2">Genres</label>
            <div className="flex flex-wrap gap-2">{GENRES.map(g=>(
              <button key={g} onClick={()=>toggle("genre",g)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.genre.includes(g)?"bg-amber-400 text-zinc-900 border-amber-400 font-semibold":"border-zinc-700 text-zinc-400 hover:border-amber-400 hover:text-amber-400"}`}>{g}</button>
            ))}</div>
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-2">Looking For (instruments needed)</label>
            <div className="flex flex-wrap gap-2">{INSTRUMENTS.map(i=>(
              <button key={i} onClick={()=>toggle("lookingFor",i)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.lookingFor.includes(i)?"bg-violet-500 text-white border-violet-500 font-semibold":"border-zinc-700 text-zinc-400 hover:border-violet-400 hover:text-violet-400"}`}>{i}</button>
            ))}</div>
          </div>
          <button onClick={submit} disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-900 font-bold text-sm py-3 rounded-xl transition-all">
            {loading ? "Creating…" : "Create Band"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── JOIN REQUEST MODAL ────────────────────────────────────────────────────────
function JoinRequestModal({ band, onClose, onSent }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/bands/${band.id}/join`, { method:"POST", headers:hj(), body:JSON.stringify({ message }) }).then(r=>r.json());
      if (res.success) { onSent(); onClose(); }
      else setError(res.message);
    } catch { setError("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">JOIN <span className="text-amber-400">{band.name}</span></h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-rose-400 text-sm bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-2">{error}</p>}
          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">Message to band leader (optional)</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Tell them why you'd be a great fit…" rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 resize-none"/>
          </div>
          <button onClick={submit} disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-900 font-bold text-sm py-3 rounded-xl transition-all">
            {loading ? "Sending…" : "Send Join Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BAND CARD ─────────────────────────────────────────────────────────────────
function BandCard({ band, currentUser, onView, onJoinSent }) {
  const [requesting, setRequesting] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const isMember = band.members?.some(m => m.userId === currentUser.id);
  const leader = band.members?.find(m => m.role === "LEADER")?.user;

  return (
    <>
      {showJoinModal && <JoinRequestModal band={band} onClose={()=>setShowJoinModal(false)} onSent={onJoinSent}/>}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <BandAvatar name={band.name} picture={band.profilePicture} size="md"/>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base truncate">{band.name}</h3>
            {band.location && <p className="text-zinc-500 text-xs mt-0.5">📍 {band.location}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                {band._count?.members || band.members?.length}
              </span>
              {isMember && <Badge label="Joined" color="amber"/>}
            </div>
          </div>
        </div>

        {band.description && <p className="text-zinc-400 text-sm line-clamp-2">{band.description}</p>}

        {band.genre?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {band.genre.slice(0,4).map(g=><Badge key={g} label={g} color="violet"/>)}
          </div>
        )}

        {band.lookingFor?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-zinc-500 text-xs">Looking for:</span>
            {band.lookingFor.map(i=><Badge key={i} label={i} color="zinc"/>)}
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-1">
          <button onClick={()=>onView(band)} className="flex-1 border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-amber-400 text-sm font-medium py-2 rounded-xl transition-all">
            View Profile
          </button>
          {!isMember && (
            <button onClick={()=>setShowJoinModal(true)}
              className="flex-1 bg-amber-400 hover:bg-amber-300 text-zinc-900 text-sm font-bold py-2 rounded-xl transition-all">
              Request to Join
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── BAND PROFILE PAGE ─────────────────────────────────────────────────────────
function BandProfile({ bandId, currentUser, onBack }) {
  const [band, setBand] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editPicFile, setEditPicFile] = useState(null);
  const [editPicPreview, setEditPicPreview] = useState(null);
  const [tab, setTab] = useState("members");

  const myMembership = band?.members?.find(m => m.userId === currentUser.id);
  const isLeader = myMembership?.role === "LEADER";
  const isMember = !!myMembership;

  const loadRequests = useCallback(async () => {
    const res = await fetch(`${API}/bands/${bandId}/requests`, { headers:h() }).then(r=>r.json());
    if (res.success) setRequests(res.data);
  }, [bandId]);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/bands/${bandId}`, { headers:h() }).then(r=>r.json());
    if (res.success) {
      const data = res.data;
      setBand(data);
      setEditForm({ name:data.name, description:data.description||"", location:data.location||"", genre:data.genre, lookingFor:data.lookingFor });
      // Check leadership immediately with the fresh data — don't rely on derived state timing
      const membership = data.members?.find(m => m.userId === currentUser.id);
      if (membership?.role === "LEADER") {
        const reqRes = await fetch(`${API}/bands/${bandId}/requests`, { headers:h() }).then(r=>r.json());
        if (reqRes.success) {
          setRequests(reqRes.data);
          if (reqRes.data.length > 0) setTab("requests");
        }
      }
    }
    setLoading(false);
  }, [bandId, currentUser.id]);

  useEffect(() => { load(); }, [load]);

  const respond = async (reqId, action) => {
    const res = await fetch(`${API}/bands/${bandId}/requests/${reqId}/respond`, { method:"POST", headers:hj(), body:JSON.stringify({ action }) }).then(r=>r.json());
    if (res.success) {
      toast.success(action === "accept" ? "Member accepted!" : "Request rejected");
      loadRequests();
      load();
    } else {
      toast.error(res.message || "Failed to respond");
    }
  };

  const removeMember = async (userId, username) => {
    if (!confirm(`Remove @${username} from the band?`)) return;
    await fetch(`${API}/bands/${bandId}/members/${userId}`, { method:"DELETE", headers:h() }).then(r=>r.json());
    load();
  };

  const leaveBand = async () => {
    if (!confirm("Leave this band?")) return;
    const res = await fetch(`${API}/bands/${bandId}/leave`, { method:"DELETE", headers:h() }).then(r=>r.json());
    if (res.success) onBack();
    else toast.error(res.message || "Failed to leave band");
  };

  const disband = async () => {
    if (!confirm(`Disband "${band.name}"? This cannot be undone.`)) return;
    const res = await fetch(`${API}/bands/${bandId}`, { method:"DELETE", headers:h() }).then(r=>r.json());
    if (res.success) onBack();
    else toast.error(res.message || "Failed to disband");
  };

  const saveEdit = async () => {
    const fd = new FormData();
    if(editForm.name) fd.append("name", editForm.name);
    if(editForm.description) fd.append("description", editForm.description);
    if(editForm.location) fd.append("location", editForm.location);
    (editForm.genre||[]).forEach(g => fd.append("genre", g));
    (editForm.lookingFor||[]).forEach(i => fd.append("lookingFor", i));
    if(editPicFile) fd.append("profilePicture", editPicFile);
    const res = await fetch(`${API}/bands/${bandId}`, { method:"PUT", headers:h(), body:fd }).then(r=>r.json());
    if (res.success) { setBand(res.data); setShowEdit(false); setEditPicFile(null); setEditPicPreview(null); toast.success("Band updated!"); }
    else toast.error(res.message || "Failed to save changes");
  };

  const toggleEdit = (field, val) => setEditForm(f => ({
    ...f, [field]: f[field].includes(val) ? f[field].filter(x=>x!==val) : [...f[field], val]
  }));

  if (loading) return <Loader/>;
  if (!band) return <div className="text-center text-zinc-500 py-16">Band not found</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors text-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15,18 9,12 15,6"/></svg>
        Back to Bands
      </button>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <div className="flex items-start gap-5">
          <BandAvatar name={band.name} picture={band.profilePicture} size="lg"/>
          <div className="flex-1 min-w-0">
            <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">{band.name}</h1>
            {band.location && <p className="text-zinc-500 text-sm mt-1">📍 {band.location}</p>}
            <p className="text-zinc-400 text-sm mt-1">{band.members?.length} member{band.members?.length !== 1 ? "s" : ""}</p>
            {band.description && <p className="text-zinc-300 text-sm mt-3 leading-relaxed">{band.description}</p>}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {band.genre?.map(g=><Badge key={g} label={g} color="violet"/>)}
            </div>
            {band.lookingFor?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                <span className="text-zinc-500 text-xs">Looking for:</span>
                {band.lookingFor.map(i=><Badge key={i} label={i} color="zinc"/>)}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {isLeader && <button onClick={()=>setShowEdit(true)} className="border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-amber-400 text-sm font-medium px-4 py-2 rounded-xl transition-all">Edit Band</button>}
          {isLeader && <button onClick={disband} className="border border-red-500/30 text-red-400 hover:bg-red-400/10 text-sm font-medium px-4 py-2 rounded-xl transition-all">Disband</button>}
          {isMember && !isLeader && <button onClick={leaveBand} className="border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-400/50 text-sm font-medium px-4 py-2 rounded-xl transition-all">Leave Band</button>}
          {!isMember && <button onClick={()=>setShowJoinModal(true)} className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-6 py-2 rounded-xl transition-all">Request to Join</button>}
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setShowEdit(false)}/>
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
              <h2 className="font-['Bebas_Neue'] text-xl text-white">EDIT <span className="text-amber-400">BAND</span></h2>
              <button onClick={()=>setShowEdit(false)} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {(editPicPreview || band?.profilePicture)
                    ? <img src={editPicPreview || `${MEDIA_BASE}${band.profilePicture}`} alt="" className="w-20 h-20 rounded-2xl object-cover"/>
                    : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-zinc-900 font-bold text-2xl">{(band?.name||"?")[0].toUpperCase()}</div>}
                  <label className="absolute -bottom-2 -right-2 bg-amber-400 hover:bg-amber-300 text-zinc-900 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(!f)return;setEditPicFile(f);setEditPicPreview(URL.createObjectURL(f));}} className="hidden"/>
                  </label>
                </div>
                <p className="text-zinc-500 text-xs">Change band photo</p>
              </div>
              <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="Band name"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"/>
              <textarea value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 resize-none"/>
              <input value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))} placeholder="Location"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"/>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-2">Genres</label>
                <div className="flex flex-wrap gap-2">{GENRES.map(g=>(
                  <button key={g} onClick={()=>toggleEdit("genre",g)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${editForm.genre?.includes(g)?"bg-amber-400 text-zinc-900 border-amber-400":"border-zinc-700 text-zinc-400 hover:border-amber-400 hover:text-amber-400"}`}>{g}</button>
                ))}</div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-2">Looking For</label>
                <div className="flex flex-wrap gap-2">{INSTRUMENTS.map(i=>(
                  <button key={i} onClick={()=>toggleEdit("lookingFor",i)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${editForm.lookingFor?.includes(i)?"bg-violet-500 text-white border-violet-500":"border-zinc-700 text-zinc-400 hover:border-violet-400 hover:text-violet-400"}`}>{i}</button>
                ))}</div>
              </div>
              <button onClick={saveEdit} className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm py-3 rounded-xl transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-4">
        {[["members","Members"], isLeader && ["requests",`Requests${requests.length>0?` (${requests.length})`:""}`]].filter(Boolean).map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab===id?"border-amber-400 text-amber-400":"border-transparent text-zinc-500 hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {tab === "members" && (
        <div className="space-y-3">
          {band.members?.map(m => (
            <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <Avatar name={m.user?.firstName || m.user?.username} picture={m.user?.profilePicture} size="md"/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">{m.user?.firstName} {m.user?.lastName}</span>
                  <Badge label={m.role} color={m.role==="LEADER"?"amber":"zinc"}/>
                </div>
                <p className="text-zinc-500 text-xs">@{m.user?.username}</p>
                {m.user?.instruments?.length > 0 && <p className="text-zinc-600 text-xs mt-0.5">{m.user.instruments.join(", ")}</p>}
              </div>
              {m.user?.skillLevel && <span className={`text-xs font-medium ${SKILL_COLORS[m.user.skillLevel]}`}>{m.user.skillLevel}</span>}
              {isLeader && m.userId !== currentUser.id && (
                <button onClick={()=>removeMember(m.userId, m.user?.username)}
                  className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Requests Tab (leader only) */}
      {tab === "requests" && isLeader && (
        <div className="space-y-3">
          {requests.length === 0 && <div className="text-center text-zinc-500 py-10 text-sm">No pending join requests</div>}
          {requests.map(r => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Avatar name={r.sender?.firstName || r.sender?.username} picture={r.sender?.profilePicture} size="md"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{r.sender?.firstName} {r.sender?.lastName}</span>
                    <span className="text-zinc-500 text-xs">@{r.sender?.username}</span>
                  </div>
                  {r.sender?.instruments?.length > 0 && <p className="text-zinc-500 text-xs mt-0.5">{r.sender.instruments.join(", ")}</p>}
                  {r.message && <p className="text-zinc-300 text-sm mt-2 bg-zinc-800 rounded-lg px-3 py-2 italic">"{r.message}"</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>respond(r.id,"accept")} className="flex-1 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm py-2 rounded-xl transition-all">Accept</button>
                <button onClick={()=>respond(r.id,"reject")} className="flex-1 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-400/50 text-sm font-medium py-2 rounded-xl transition-all">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showJoinModal && <JoinRequestModal band={band} onClose={()=>setShowJoinModal(false)} onSent={()=>{}}/>}
    </div>
  );
}

// ── MY BANDS TAB ──────────────────────────────────────────────────────────────
function MyBands({ currentUser, onView, onCreateBand }) {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/bands/my`, { headers:h() }).then(r=>r.json()),
      fetch(`${API}/bands/requests/sent`, { headers:h() }).then(r=>r.json()),
    ]).then(([b, req]) => {
      if (b.success) setBands(b.data);
      if (req.success) setSentRequests(req.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader/>;

  return (
    <div className="space-y-6">
      {bands.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="text-5xl mb-3">🎸</div>
          <p className="text-zinc-300 font-semibold mb-1">You're not in any bands yet</p>
          <p className="text-zinc-600 text-sm mb-5">Create your own or browse and join one</p>
          <button onClick={onCreateBand} className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-6 py-2.5 rounded-xl transition-all">Create a Band</button>
        </div>
      ) : (
        <div>
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">Your Bands</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bands.map(b => (
              <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 cursor-pointer hover:border-zinc-700 transition-all" onClick={()=>onView(b)}>
                <div className="flex items-center gap-3 mb-3">
                  <BandAvatar name={b.name} picture={b.profilePicture} size="md"/>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm truncate">{b.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">{b.members?.length} members</span>
                      <Badge label={b.myRole} color={b.myRole==="LEADER"?"amber":"zinc"}/>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">{b.genre?.slice(0,3).map(g=><Badge key={g} label={g} color="violet"/>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sentRequests.length > 0 && (
        <div>
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">Pending Requests Sent</h3>
          <div className="space-y-2">
            {sentRequests.map(r => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-white text-sm font-semibold">{r.band?.name}</span>
                  {r.band?.location && <span className="text-zinc-500 text-xs ml-2">· {r.band.location}</span>}
                </div>
                <Badge label={r.status} color={r.status==="PENDING"?"amber":r.status==="ACCEPTED"?"violet":"zinc"}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DISCOVER TAB ──────────────────────────────────────────────────────────────
function Discover({ currentUser, onView }) {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [instrument, setInstrument] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (genre) p.set("genre", genre);
    if (instrument) p.set("instrument", instrument);
    fetch(`${API}/bands?${p}`, { headers:h() }).then(r=>r.json())
      .then(d => { if (d.success) setBands(d.data); }).finally(()=>setLoading(false));
  }, [search, genre, instrument]);

  useEffect(() => { const t = setTimeout(load, 300); return ()=>clearTimeout(t); }, [load]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bands…"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>
        <select value={genre} onChange={e=>setGenre(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400">
          <option value="">All Genres</option>
          {GENRES.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
        <select value={instrument} onChange={e=>setInstrument(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400">
          <option value="">Any Instrument</option>
          {INSTRUMENTS.map(i=><option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {loading ? <Loader/> : (
        bands.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">No bands found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bands.map(b=><BandCard key={b.id} band={b} currentUser={currentUser} onView={onView} onJoinSent={()=>{}}/>)}
          </div>
        )
      )}
    </div>
  );
}

// ── MAIN BANDS PAGE ───────────────────────────────────────────────────────────
export default function BandsPage({ currentUser, onBack }) {
  const [tab, setTab] = useState("discover");
  const [showCreate, setShowCreate] = useState(false);
  const [viewBandId, setViewBandId] = useState(null);

  if (viewBandId) return <BandProfile bandId={viewBandId} currentUser={currentUser} onBack={()=>setViewBandId(null)}/>;

  return (
    <>
      <style>{`@keyframes bb{from{transform:scaleY(.3);opacity:.5}to{transform:scaleY(1);opacity:1}}.line-clamp-2{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}`}</style>
      {showCreate && <CreateBandModal onClose={()=>setShowCreate(false)} onCreate={b=>{ setShowCreate(false); setViewBandId(b.id); }}/>}

      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="15,18 9,12 15,6"/></svg>
              </button>
              <h1 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">BANDS & <span className="text-amber-400">COLLABS</span></h1>
            </div>
            <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-4 py-2 rounded-xl transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Band
            </button>
          </div>
          <div className="max-w-3xl mx-auto px-4 flex border-t border-zinc-800">
            {[["discover","Discover"],["my","My Bands"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab===id?"border-amber-400 text-amber-400":"border-transparent text-zinc-500 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {tab === "discover" && <Discover currentUser={currentUser} onView={b=>setViewBandId(b.id)}/>}
          {tab === "my" && <MyBands currentUser={currentUser} onView={b=>setViewBandId(b.id)} onCreateBand={()=>setShowCreate(true)}/>}
        </div>
      </div>
    </>
  );
}
