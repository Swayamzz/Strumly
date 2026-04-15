import { useState } from "react";

const API = "http://localhost:5000/api";
const SKILLS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"];

export default function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    firstName:    user?.firstName  || "",
    lastName:     user?.lastName   || "",
    bio:          user?.bio        || "",
    location:     user?.location   || "",
    instruments:  (user?.instruments || []).join(", "),
    genres:       (user?.genres      || []).join(", "),
    skillLevel:   user?.skillLevel || "",
    availability: user?.availability || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview]       = useState(user?.profilePicture ? `http://localhost:5000${user.profilePicture}` : null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const token = localStorage.getItem("strumly_token");

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    if (avatarFile) fd.append("avatar", avatarFile);

    try {
      const res  = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSave(data.data);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const overlay = { position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 };
  const modal   = { background:"#fff",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",padding:32,position:"relative" };
  const label   = { display:"block",fontSize:13,fontWeight:600,color:"#333",marginBottom:4 };
  const input   = { width:"100%",padding:"10px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box" };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <h2 style={{ fontSize:20,fontWeight:700,marginBottom:20 }}>Edit Profile</h2>

        {/* Avatar */}
        <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:24 }}>
          <div style={{ width:72,height:72,borderRadius:"50%",background:"#eee",overflow:"hidden",flexShrink:0 }}>
            {preview
              ? <img src={preview} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
              : <div style={{ width:72,height:72,background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:28,fontWeight:700 }}>
                  {(form.firstName?.[0] || "?").toUpperCase()}
                </div>
            }
          </div>
          <div>
            <label style={{ ...label,marginBottom:6 }}>Profile Picture</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ fontSize:13 }}/>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
            <div>
              <label style={label}>First Name</label>
              <input style={input} value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} placeholder="First name"/>
            </div>
            <div>
              <label style={label}>Last Name</label>
              <input style={input} value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} placeholder="Last name"/>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={label}>Bio</label>
            <textarea style={{ ...input,resize:"vertical",minHeight:80 }} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Tell musicians about yourself..."/>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={label}>Location</label>
            <input style={input} value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="City, Country"/>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={label}>Instruments (comma separated)</label>
            <input style={input} value={form.instruments} onChange={e=>setForm({...form,instruments:e.target.value})} placeholder="Guitar, Piano, Drums"/>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={label}>Genres (comma separated)</label>
            <input style={input} value={form.genres} onChange={e=>setForm({...form,genres:e.target.value})} placeholder="Rock, Jazz, Blues"/>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
            <div>
              <label style={label}>Skill Level</label>
              <select style={input} value={form.skillLevel} onChange={e=>setForm({...form,skillLevel:e.target.value})}>
                <option value="">Select level</option>
                {SKILLS.map(s=><option key={s} value={s}>{s.charAt(0)+s.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Availability</label>
              <input style={input} value={form.availability} onChange={e=>setForm({...form,availability:e.target.value})} placeholder="Weekends, evenings..."/>
            </div>
          </div>

          {error && <p style={{ color:"#e74c3c",fontSize:13,marginBottom:12 }}>{error}</p>}

          <div style={{ display:"flex",gap:12,justifyContent:"flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding:"10px 20px",border:"1px solid #ddd",borderRadius:8,background:"#fff",cursor:"pointer",fontWeight:600 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding:"10px 24px",background:"#1a1a2e",color:"white",border:"none",borderRadius:8,fontWeight:600,cursor:"pointer" }}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
