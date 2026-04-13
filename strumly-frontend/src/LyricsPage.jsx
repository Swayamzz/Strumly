import { useState } from "react";
import toast from "./toast";

const API_BASE = "http://localhost:5000/api";
const token = () => localStorage.getItem("strumly_token");

const GENRES = ["Pop", "Rock", "Hip-Hop", "R&B", "Country", "Jazz", "Blues", "Metal", "Folk", "Electronic", "Reggae", "Classical", "Indie", "Punk", "Soul"];
const MOODS  = ["Happy", "Sad", "Angry", "Romantic", "Melancholic", "Energetic", "Peaceful", "Nostalgic", "Dark", "Hopeful", "Rebellious", "Dreamy"];

export default function LyricsPage({ onBack }) {
  const [genre, setGenre]   = useState("");
  const [mood, setMood]     = useState("");
  const [theme, setTheme]   = useState("");
  const [title, setTitle]   = useState("");
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!genre) return toast.error("Please select a genre.");
    if (!mood)  return toast.error("Please select a mood.");
    if (!theme.trim()) return toast.error("Please enter a theme or topic.");

    setLoading(true);
    setLyrics("");
    try {
      const res = await fetch(`${API_BASE}/lyrics/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ genre, mood, theme: theme.trim(), title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to generate lyrics");
      setLyrics(data.lyrics);
      toast.success("Lyrics generated!");
    } catch (e) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyLyrics = () => {
    if (!lyrics) return;
    navigator.clipboard.writeText(lyrics).then(() => toast.success("Lyrics copied!")).catch(() => toast.error("Could not copy"));
  };

  const reset = () => { setGenre(""); setMood(""); setTheme(""); setTitle(""); setLyrics(""); };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-400">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div>
            <h1 className="font-['Bebas_Neue'] text-xl tracking-widest text-white">AI LYRICS <span className="text-amber-400">GENERATOR</span></h1>
            <p className="text-zinc-500 text-xs">Powered by Claude AI</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Inputs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Configure Your Song</h2>

          {/* Genre */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2 font-medium">Genre <span className="text-amber-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button key={g} onClick={() => setGenre(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${genre === g ? "bg-amber-400 text-zinc-900 border-amber-400" : "border-zinc-700 text-zinc-400 hover:border-amber-400/50 hover:text-white"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2 font-medium">Mood <span className="text-amber-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button key={m} onClick={() => setMood(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${mood === m ? "bg-amber-400 text-zinc-900 border-amber-400" : "border-zinc-700 text-zinc-400 hover:border-amber-400/50 hover:text-white"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2 font-medium">Theme / Topic <span className="text-amber-400">*</span></label>
            <input
              type="text"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="e.g. lost love, finding yourself, late night drives..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50 transition-colors"
            />
          </div>

          {/* Title (optional) */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2 font-medium">Song Title <span className="text-zinc-600">(optional)</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Fading Lights"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50 transition-colors"
            />
          </div>

          {/* Generate Button */}
          <button onClick={generate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 text-zinc-900 font-bold py-3 rounded-xl transition-all text-sm">
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
                </svg>
                Generating lyrics...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                </svg>
                Generate Lyrics
              </>
            )}
          </button>
        </div>

        {/* Output */}
        {lyrics && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Generated Lyrics</h2>
                {title && <p className="text-amber-400 font-['Bebas_Neue'] text-lg tracking-wider mt-1">{title}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={copyLyrics}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:border-amber-400/50 hover:text-amber-400 transition-all">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
                <button onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:border-red-400/50 hover:text-red-400 transition-all">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/>
                  </svg>
                  Reset
                </button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs rounded-lg">{genre}</span>
              <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg">{mood}</span>
            </div>

            <pre className="whitespace-pre-wrap text-sm text-zinc-200 leading-7 font-sans bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
              {lyrics}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
