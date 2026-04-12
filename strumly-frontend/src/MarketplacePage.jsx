import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost:5000/api";
const MEDIA = "http://localhost:5000";
const token = () => localStorage.getItem("strumly_token");
const h = () => ({ Authorization: `Bearer ${token()}` });

const CATEGORIES = ["Guitar","Bass","Drums","Piano","Keyboard","Violin","Cello","Saxophone","Trumpet","Flute","Ukulele","Banjo","Synthesizer","Microphone","Amplifier","Pedals & Effects","Recording Gear","Other"];
const CONDITIONS = ["NEW","LIKE_NEW","GOOD","FAIR","POOR"];
const CONDITION_LABELS = { NEW:"New", LIKE_NEW:"Like New", GOOD:"Good", FAIR:"Fair", POOR:"Poor" };
const CONDITION_COLORS = { NEW:"text-emerald-400 bg-emerald-400/10 border-emerald-400/30", LIKE_NEW:"text-blue-400 bg-blue-400/10 border-blue-400/30", GOOD:"text-amber-400 bg-amber-400/10 border-amber-400/30", FAIR:"text-orange-400 bg-orange-400/10 border-orange-400/30", POOR:"text-red-400 bg-red-400/10 border-red-400/30" };
const STATUS_COLORS = { AVAILABLE:"text-emerald-400 bg-emerald-400/10 border-emerald-400/30", RESERVED:"text-amber-400 bg-amber-400/10 border-amber-400/30", SOLD:"text-zinc-500 bg-zinc-700/50 border-zinc-600" };

function Loader() {
  return <div className="flex justify-center py-16"><div className="flex items-end gap-[3px] h-8">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.1}s ease-in-out infinite alternate`}}/>)}</div></div>;
}

function Badge({ label, colorClass }) {
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>{label}</span>;
}

function ImgCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return (
    <div className="w-full h-48 bg-zinc-800 rounded-xl flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-zinc-600"><path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
    </div>
  );
  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-zinc-800 group">
      <img src={`${MEDIA}${images[idx]}`} alt="" className="w-full h-full object-cover"/>
      {images.length > 1 && (
        <>
          <button onClick={e=>{e.stopPropagation();setIdx(i=>(i-1+images.length)%images.length);}} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">‹</button>
          <button onClick={e=>{e.stopPropagation();setIdx(i=>(i+1)%images.length);}} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_,i)=><div key={i} className={`w-1.5 h-1.5 rounded-full ${i===idx?"bg-white":"bg-white/40"}`}/>)}
          </div>
        </>
      )}
    </div>
  );
}

// ── CREATE / EDIT LISTING MODAL ───────────────────────────────────────────────
function ListingFormModal({ onClose, onSaved, existing }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    title: existing?.title || "",
    description: existing?.description || "",
    price: existing?.price || "",
    condition: existing?.condition || "",
    category: existing?.category || "",
    location: existing?.location || "",
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState(existing?.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const onFiles = (e) => {
    const chosen = Array.from(e.target.files).slice(0, 4);
    setFiles(chosen);
    setPreviews(chosen.map(f => URL.createObjectURL(f)));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.price || !form.condition || !form.category) {
      setError("Title, price, condition and category are required"); return;
    }
    setLoading(true); setError("");
    try {
      let res;
      if (isEdit) {
        res = await fetch(`${API}/listings/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...h() },
          body: JSON.stringify(form),
        }).then(r => r.json());
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
        files.forEach(f => fd.append("images", f));
        res = await fetch(`${API}/listings`, { method: "POST", headers: h(), body: fd }).then(r => r.json());
      }
      if (res.success) { onSaved(res.data); onClose(); }
      else setError(res.message);
    } catch { setError("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h2 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">{isEdit ? "EDIT" : "SELL AN"} <span className="text-amber-400">INSTRUMENT</span></h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-rose-400 text-sm bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-2">{error}</p>}

          {/* Images */}
          {!isEdit && (
            <div>
              <label className="text-zinc-400 text-xs font-medium block mb-2">Photos (up to 4)</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {previews.map((p, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                    <img src={p} className="w-full h-full object-cover"/>
                  </div>
                ))}
                {previews.length < 4 && (
                  <button onClick={()=>fileRef.current.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-amber-400 flex items-center justify-center text-zinc-500 hover:text-amber-400 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden"/>
            </div>
          )}

          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">Title *</label>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Fender Stratocaster 2020"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-xs font-medium block mb-1.5">Price (USD) *</label>
              <input type="number" min="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-medium block mb-1.5">Location</label>
              <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="City, Country"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-xs font-medium block mb-1.5">Category *</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400">
                <option value="">Select…</option>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-medium block mb-1.5">Condition *</label>
              <select value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400">
                <option value="">Select…</option>
                {CONDITIONS.map(c=><option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs font-medium block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              placeholder="Describe the instrument — age, brand, any issues, what's included…" rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 resize-none"/>
          </div>

          <button onClick={submit} disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-900 font-bold text-sm py-3 rounded-xl transition-all">
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Post Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LISTING DETAIL ────────────────────────────────────────────────────────────
function ListingDetail({ listing: initial, currentUser, onBack, onUpdated, onMessage }) {
  const [listing, setListing] = useState(initial);
  const [showEdit, setShowEdit] = useState(false);
  const isMine = listing.sellerId === currentUser.id;
  const [imgIdx, setImgIdx] = useState(0);

  const updateStatus = async (status) => {
    const res = await fetch(`${API}/listings/${listing.id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json", ...h() },
      body: JSON.stringify({ status }),
    }).then(r => r.json());
    if (res.success) { setListing(res.data); onUpdated(res.data); }
  };

  const remove = async () => {
    if (!confirm("Delete this listing?")) return;
    const res = await fetch(`${API}/listings/${listing.id}`, { method: "DELETE", headers: h() }).then(r => r.json());
    if (res.success) onBack(true);
  };

  return (
    <>
      {showEdit && <ListingFormModal existing={listing} onClose={()=>setShowEdit(false)} onSaved={d=>{setListing(d);onUpdated(d);}}/>}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <button onClick={()=>onBack(false)} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 text-sm transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15,18 9,12 15,6"/></svg>
          Back to Marketplace
        </button>

        {/* Images */}
        {listing.images?.length > 0 ? (
          <div className="mb-4">
            <div className="w-full h-72 rounded-2xl overflow-hidden bg-zinc-900 mb-2">
              <img src={`${MEDIA}${listing.images[imgIdx]}`} alt="" className="w-full h-full object-contain"/>
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2">
                {listing.images.map((img, i) => (
                  <button key={i} onClick={()=>setImgIdx(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i===imgIdx?"border-amber-400":"border-zinc-800"}`}>
                    <img src={`${MEDIA}${img}`} className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 text-zinc-700"><path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
        )}

        {/* Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-white font-bold text-xl leading-tight">{listing.title}</h1>
            <span className="text-amber-400 font-bold text-2xl whitespace-nowrap">${Number(listing.price).toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge label={CONDITION_LABELS[listing.condition]} colorClass={CONDITION_COLORS[listing.condition]}/>
            <Badge label={listing.status} colorClass={STATUS_COLORS[listing.status]}/>
            <Badge label={listing.category} colorClass="bg-violet-400/10 text-violet-400 border-violet-400/30"/>
            {listing.location && <span className="text-zinc-500 text-xs">📍 {listing.location}</span>}
          </div>
          {listing.description && <p className="text-zinc-300 text-sm leading-relaxed">{listing.description}</p>}
        </div>

        {/* Seller */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
          <p className="text-zinc-500 text-xs font-medium mb-3">SELLER</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-zinc-900">
              {(listing.seller?.firstName || listing.seller?.username || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{listing.seller?.firstName} {listing.seller?.lastName}</p>
              <p className="text-zinc-500 text-xs">@{listing.seller?.username}{listing.seller?.location ? ` · ${listing.seller.location}` : ""}</p>
            </div>
          </div>
          {!isMine && listing.status === "AVAILABLE" && (
            <button
              onClick={() => onMessage && onMessage(listing.seller)}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm py-3 rounded-xl transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Contact Seller
            </button>
          )}
        </div>

        {/* Owner actions */}
        {isMine && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <p className="text-zinc-500 text-xs font-medium">MANAGE LISTING</p>
            <div className="flex flex-wrap gap-2">
              {listing.status !== "AVAILABLE"  && <button onClick={()=>updateStatus("AVAILABLE")}  className="text-sm border border-zinc-700 text-zinc-300 hover:text-emerald-400 hover:border-emerald-400/50 px-4 py-2 rounded-xl transition-all">Mark Available</button>}
              {listing.status !== "RESERVED"   && <button onClick={()=>updateStatus("RESERVED")}   className="text-sm border border-zinc-700 text-zinc-300 hover:text-amber-400 hover:border-amber-400/50 px-4 py-2 rounded-xl transition-all">Mark Reserved</button>}
              {listing.status !== "SOLD"        && <button onClick={()=>updateStatus("SOLD")}        className="text-sm border border-zinc-700 text-zinc-300 hover:text-blue-400 hover:border-blue-400/50 px-4 py-2 rounded-xl transition-all">Mark Sold</button>}
              <button onClick={()=>setShowEdit(true)} className="text-sm border border-zinc-700 text-zinc-300 hover:text-white px-4 py-2 rounded-xl transition-all">Edit</button>
              <button onClick={remove} className="text-sm border border-red-500/30 text-red-400 hover:bg-red-400/10 px-4 py-2 rounded-xl transition-all">Delete</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── LISTING CARD ──────────────────────────────────────────────────────────────
function ListingCard({ listing, onClick }) {
  return (
    <div onClick={onClick} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer group">
      {/* Image */}
      {listing.images?.length > 0 ? (
        <div className="h-44 overflow-hidden bg-zinc-800">
          <img src={`${MEDIA}${listing.images[0]}`} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
        </div>
      ) : (
        <div className="h-44 bg-zinc-800 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-zinc-600"><path d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/></svg>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight">{listing.title}</h3>
          <span className="text-amber-400 font-bold text-base whitespace-nowrap">${Number(listing.price).toLocaleString()}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge label={CONDITION_LABELS[listing.condition]} colorClass={CONDITION_COLORS[listing.condition]}/>
          {listing.status !== "AVAILABLE" && <Badge label={listing.status} colorClass={STATUS_COLORS[listing.status]}/>}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-600 text-xs">{listing.category}</span>
          {listing.location && <span className="text-zinc-600 text-xs truncate ml-2">📍 {listing.location}</span>}
        </div>
        <p className="text-zinc-500 text-xs mt-1.5">@{listing.seller?.username}</p>
      </div>
    </div>
  );
}

// ── MY LISTINGS TAB ───────────────────────────────────────────────────────────
function MyListings({ currentUser, onView, onSell }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/listings/my`, { headers: h() }).then(r => r.json())
      .then(d => { if (d.success) setListings(d.data); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader/>;
  if (listings.length === 0) return (
    <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
      <div className="text-5xl mb-3">🎸</div>
      <p className="text-zinc-300 font-semibold mb-1">No listings yet</p>
      <p className="text-zinc-600 text-sm mb-5">Sell your instruments to fellow musicians</p>
      <button onClick={onSell} className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-6 py-2.5 rounded-xl transition-all">Post a Listing</button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {listings.map(l => <ListingCard key={l.id} listing={l} onClick={()=>onView(l)}/>)}
    </div>
  );
}

// ── BROWSE TAB ────────────────────────────────────────────────────────────────
function Browse({ currentUser, onView }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ status: "AVAILABLE" });
    if (search)    p.set("search", search);
    if (category)  p.set("category", category);
    if (condition) p.set("condition", condition);
    if (location)  p.set("location", location);
    if (maxPrice)  p.set("maxPrice", maxPrice);
    fetch(`${API}/listings?${p}`, { headers: h() }).then(r => r.json())
      .then(d => { if (d.success) setListings(d.data); }).finally(() => setLoading(false));
  }, [search, category, condition, location, maxPrice]);

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [load]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search instruments…"
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select value={category} onChange={e=>setCategory(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400">
          <option value="">All Categories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={condition} onChange={e=>setCondition(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400">
          <option value="">Any Condition</option>
          {CONDITIONS.map(c=><option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
        </select>
        <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location…"
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>
        <input type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="Max price…"
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400"/>
      </div>

      {loading ? <Loader/> : listings.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">No listings found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(l => <ListingCard key={l.id} listing={l} onClick={()=>onView(l)}/>)}
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function MarketplacePage({ currentUser, onBack, onMessage }) {
  const [tab, setTab] = useState("browse");
  const [showSell, setShowSell] = useState(false);
  const [detail, setDetail] = useState(null);
  const [allListings, setAllListings] = useState([]);

  if (detail) return (
    <MarketplacePage.Detail
      listing={detail} currentUser={currentUser}
      onBack={(deleted) => { if (deleted) setDetail(null); else setDetail(null); }}
      onUpdated={d => setDetail(d)}
      onMessage={onMessage}
    />
  );

  return (
    <>
      <style>{`@keyframes bb{from{transform:scaleY(.3);opacity:.5}to{transform:scaleY(1);opacity:1}}.line-clamp-2{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}`}</style>
      {showSell && (
        <ListingFormModal onClose={()=>setShowSell(false)} onSaved={listing=>{ setShowSell(false); setDetail(listing); }}/>
      )}

      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="15,18 9,12 15,6"/></svg>
              </button>
              <div>
                <h1 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">INSTRUMENT <span className="text-amber-400">MARKETPLACE</span></h1>
                <p className="text-zinc-500 text-xs hidden sm:block">Buy & sell instruments with local musicians</p>
              </div>
            </div>
            <button onClick={()=>setShowSell(true)} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-4 py-2 rounded-xl transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Sell
            </button>
          </div>
          <div className="max-w-5xl mx-auto px-4 flex border-t border-zinc-800">
            {[["browse","Browse"],["my","My Listings"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab===id?"border-amber-400 text-amber-400":"border-transparent text-zinc-500 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          {tab === "browse" && <Browse currentUser={currentUser} onView={setDetail}/>}
          {tab === "my"     && <MyListings currentUser={currentUser} onView={setDetail} onSell={()=>setShowSell(true)}/>}
        </div>
      </div>
    </>
  );
}

MarketplacePage.Detail = ListingDetail;
