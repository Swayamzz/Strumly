import { useState } from "react";

const API_BASE = "http://localhost:5000/api";
const INSTRUMENTS = ["Guitar","Bass","Drums","Piano","Vocals","Violin","Saxophone","Trumpet","Keys","DJ"];
const GENRES = ["Rock","Jazz","Pop","Metal","Blues","Classical","Hip-Hop","Electronic","Folk","Indie"];
const SKILL_LEVELS = ["BEGINNER","INTERMEDIATE","ADVANCED","PROFESSIONAL"];

function MusicBars() {
  return (
    <div className="flex items-end gap-[3px] h-7">
      {[1,2,3,4,5].map(i=>(
        <div key={i} className="w-[3px] bg-amber-400 rounded-full"
          style={{height:`${20+i*8}%`,animation:`bb ${.6+i*.15}s ease-in-out infinite alternate`,animationDelay:`${i*.1}s`}}/>
      ))}
      <style>{`@keyframes bb{from{transform:scaleY(.3);opacity:.5}to{transform:scaleY(1);opacity:1}}`}</style>
    </div>
  );
}

function MultiSelect({ options, selected, onChange, label }) {
  const toggle = opt => onChange(selected.includes(opt)?selected.filter(x=>x!==opt):[...selected,opt]);
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt=>(
          <button key={opt} type="button" onClick={()=>toggle(opt)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${selected.includes(opt)?"bg-amber-400 border-amber-400 text-zinc-900":"bg-transparent border-zinc-600 text-zinc-400 hover:border-amber-400 hover:text-amber-400"}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, error, textarea, ...props }) {
  const cls = `w-full bg-zinc-800/60 border rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 ${error?"border-red-500":"border-zinc-700"}`;
  return (
    <div>
      {label && <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">{label}</label>}
      {textarea
        ? <textarea {...props} rows={3} className={cls+" resize-none"}/>
        : <input {...props} className={cls}/>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Btn({ loading, children, ...props }) {
  return (
    <button {...props} disabled={loading||props.disabled}
      className={`w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-900 font-bold text-sm tracking-widest uppercase py-3.5 rounded-lg transition-all duration-200 ${props.className||""}`}>
      {loading
        ? <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </span>
        : children}
    </button>
  );
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-end p-12 bg-zinc-950 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]"
        style={{backgroundImage:"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",backgroundSize:"60px 60px"}}/>
      <div className="absolute inset-0 flex items-center justify-center">
  <span className="font-['Bebas_Neue'] text-[6rem] text-zinc-700 opacity-50 tracking-[0.3em] select-none pointer-events-none">
    STRUMLY
  </span>
</div>
      <div className="relative z-10">
        <div className="w-12 h-[2px] bg-amber-400 mb-6"/>
        <blockquote className="text-zinc-300 text-lg font-light leading-relaxed mb-6 italic">
          "Music is the shorthand of emotion. Find the people who speak your language."
        </blockquote>
        <p className="text-zinc-600 text-xs tracking-widest uppercase">— The Strumly Manifesto</p>
      </div>
    </div>
  );
}

function LoginPage({ onSwitch, onLogin }) {
  const [form, setForm] = useState({ email:"", password:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e={};
    if(!form.email) e.email="Email is required";
    if(!form.password) e.password="Password is required";
    return e;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    const e=validate(); setErrors(e);
    if(Object.keys(e).length) return;
    setLoading(true); setApiError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:form.email,password:form.password})
      });
      const data = await res.json();
      if(!data.success) throw new Error(data.message);
      onLogin(data.data.user, data.data.token);
    } catch(err){ setApiError(err.message||"Login failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-8">
          <MusicBars/>
          <span className="font-['Bebas_Neue'] text-3xl tracking-widest text-white">STRUMLY</span>
        </div>
        <h1 className="font-['Bebas_Neue'] text-5xl text-white leading-none mb-2">WELCOME<br/><span className="text-amber-400">BACK.</span></h1>
        <p className="text-zinc-400 text-sm">Your bandmates are waiting.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} error={errors.email}/>
        <Field label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} error={errors.password}/>
        {apiError && <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-400">{apiError}</div>}
        <Btn loading={loading} type="submit">Sign In</Btn>
      </form>
      <p className="mt-8 text-center text-zinc-500 text-sm">
        New to Strumly?{" "}
        <button onClick={onSwitch} className="text-amber-400 font-semibold hover:underline">Join the band</button>
      </p>
    </div>
  );
}

function RegisterPage({ onSwitch, onLogin }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email:"",password:"",confirmPassword:"",username:"",
    firstName:"",lastName:"",bio:"",location:"",
    instruments:[],genres:[],skillLevel:"",experience:"",availability:""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = f => e => setForm({...form,[f]:e.target.value});

  const validateStep1 = () => {
    const e={};
    if(!form.email) e.email="Email is required";
    else if(!/\S+@\S+\.\S+/.test(form.email)) e.email="Enter a valid email";
    if(!form.username) e.username="Username is required";
    if(!form.password) e.password="Password is required";
    else if(form.password.length<6) e.password="Minimum 6 characters";
    if(form.password!==form.confirmPassword) e.confirmPassword="Passwords don't match";
    return e;
  };

  const handleNext = ev => {
    ev.preventDefault();
    const e=validateStep1(); setErrors(e);
    if(!Object.keys(e).length){ setErrors({}); setStep(2); }
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    setLoading(true); setApiError("");
    try {
      const res = await fetch(`${API_BASE}/auth/register`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          email:form.email,password:form.password,username:form.username,
          firstName:form.firstName||undefined,lastName:form.lastName||undefined,
          bio:form.bio||undefined,location:form.location||undefined,
          instruments:form.instruments,genres:form.genres,
          skillLevel:form.skillLevel||undefined,
          experience:form.experience?parseInt(form.experience):undefined,
          availability:form.availability||undefined,
        })
      });
      const data = await res.json();
      if(!data.success) throw new Error(data.message);
      onLogin(data.data.user, data.data.token);
    } catch(err){ setApiError(err.message||"Registration failed."); setStep(1); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-8">
          <MusicBars/>
          <span className="font-['Bebas_Neue'] text-3xl tracking-widest text-white">STRUMLY</span>
        </div>
        <h1 className="font-['Bebas_Neue'] text-5xl text-white leading-none mb-2">
          {step===1?<>CREATE YOUR<br/><span className="text-amber-400">PROFILE.</span></>:<>YOUR<br/><span className="text-amber-400">SOUND.</span></>}
        </h1>
        <p className="text-zinc-400 text-sm">{step===1?"Step 1 of 2 — The basics":"Step 2 of 2 — Your music"}</p>
        <div className="flex gap-2 mt-4">
          <div className="h-1 flex-1 rounded-full bg-amber-400"/>
          <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step===2?"bg-amber-400":"bg-zinc-700"}`}/>
        </div>
      </div>

      {step===1?(
        <form onSubmit={handleNext} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" placeholder="Jane" value={form.firstName} onChange={set("firstName")}/>
            <Field label="Last Name" placeholder="Doe" value={form.lastName} onChange={set("lastName")}/>
          </div>
          <Field label="Username *" placeholder="@jdoe_bass" value={form.username} onChange={set("username")} error={errors.username}/>
          <Field label="Email *" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} error={errors.email}/>
          <Field label="Password *" type="password" placeholder="min 6 characters" value={form.password} onChange={set("password")} error={errors.password}/>
          <Field label="Confirm Password *" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword}/>
          {apiError && <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-400">{apiError}</div>}
          <Btn type="submit">Continue →</Btn>
        </form>
      ):(
        <form onSubmit={handleSubmit} className="space-y-5">
          <MultiSelect label="Instruments" options={INSTRUMENTS} selected={form.instruments} onChange={v=>setForm({...form,instruments:v})}/>
          <MultiSelect label="Genres" options={GENRES} selected={form.genres} onChange={v=>setForm({...form,genres:v})}/>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Skill Level</label>
            <select value={form.skillLevel} onChange={set("skillLevel")}
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all">
              <option value="">Select level</option>
              {SKILL_LEVELS.map(l=><option key={l} value={l}>{l.charAt(0)+l.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Experience (yrs)" type="number" placeholder="3" value={form.experience} onChange={set("experience")}/>
            <Field label="Location" placeholder="Kathmandu" value={form.location} onChange={set("location")}/>
          </div>
          <Field label="Availability" placeholder="Weekends, Evenings…" value={form.availability} onChange={set("availability")}/>
          <Field label="Bio" textarea placeholder="Tell bands about yourself…" value={form.bio} onChange={set("bio")}/>
          {apiError && <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-400">{apiError}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={()=>setStep(1)}
              className="flex-1 border border-zinc-600 hover:border-zinc-400 text-zinc-300 font-semibold text-sm py-3.5 rounded-lg transition-all">
              ← Back
            </button>
            <Btn loading={loading} type="submit" className="flex-[2] w-auto">Create Account</Btn>
          </div>
        </form>
      )}
      <p className="mt-8 text-center text-zinc-500 text-sm">
        Already a member?{" "}
        <button onClick={onSwitch} className="text-amber-400 font-semibold hover:underline">Sign in</button>
      </p>
    </div>
  );
}

export default function AuthPages({ onLogin }) {
  const [page, setPage] = useState("login");
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin:0; font-family:'DM Sans',sans-serif; }
        select option { background:#27272a; color:#fff; }
      `}</style>
      <div className="min-h-screen bg-zinc-900 flex">
        <LeftPanel/>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16 overflow-y-auto">
          <div className="relative z-10 w-full">
            {page==="login"
              ? <LoginPage onSwitch={()=>setPage("register")} onLogin={onLogin}/>
              : <RegisterPage onSwitch={()=>setPage("login")} onLogin={onLogin}/>}
          </div>
        </div>
      </div>
    </>
  );
}
