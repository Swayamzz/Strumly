import { useState, useEffect } from "react";
import AuthPages from "./AuthPages";
import HomePage from "./HomePage";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("strumly_token");
    const saved = localStorage.getItem("strumly_user");
    if (token && saved) {
      try { setUser(JSON.parse(saved)); }
      catch { localStorage.removeItem("strumly_token"); localStorage.removeItem("strumly_user"); }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem("strumly_token", token);
    localStorage.setItem("strumly_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("strumly_token");
    localStorage.removeItem("strumly_user");
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center gap-[3px]">
      <style>{`@keyframes bb{from{transform:scaleY(.3);opacity:.4}to{transform:scaleY(1);opacity:1}}`}</style>
      {[1,2,3,4,5].map(i=>(
        <div key={i} className="w-[3px] bg-amber-400 rounded-full h-8"
          style={{animation:`bb ${.5+i*.12}s ease-in-out infinite alternate`,animationDelay:`${i*.09}s`}}/>
      ))}
    </div>
  );

  if (!user) return <AuthPages onLogin={handleLogin} />;
  return <HomePage user={user} onLogout={handleLogout} />;
}
