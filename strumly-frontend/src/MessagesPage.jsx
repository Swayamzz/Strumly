import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "http://localhost:5000/api";
const token = () => localStorage.getItem("strumly_token");
const AVATAR_COLORS = ["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600","from-red-400 to-rose-600"];

function timeAgo(d){const s=(Date.now()-new Date(d))/1000;if(s<60)return"just now";if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;if(s<604800)return`${Math.floor(s/86400)}d`;return new Date(d).toLocaleDateString();}
function Avatar({user,size="md",ring=false}){
  const m={sm:"w-8 h-8 text-xs",md:"w-10 h-10 text-sm",lg:"w-12 h-12 text-base"};
  const c=(user?.username||"").charCodeAt(0)%AVATAR_COLORS.length;
  return(<div className={`${m[size]} rounded-full bg-gradient-to-br ${AVATAR_COLORS[c]} flex items-center justify-center font-bold text-white flex-shrink-0 ${ring?"ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900":""}`}>{((user?.firstName||user?.username||"?")[0]).toUpperCase()}</div>);
}

// ── NEW CONVERSATION MODAL ────────────────────────────────────────────────────
function NewConversationModal({ currentUser, onClose, onOpen }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch mutual followers (people who follow you OR you follow)
    Promise.all([
      fetch(`${API_BASE}/follow/${currentUser.id}/followers`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
      fetch(`${API_BASE}/follow/${currentUser.id}/following`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json()),
    ]).then(([fersData, fingData]) => {
      const combined = [...(fersData.data||[]), ...(fingData.data||[])];
      // Deduplicate by id
      const seen = new Set();
      const unique = combined.filter(u => { if(seen.has(u.id)) return false; seen.add(u.id); return true; });
      setUsers(unique);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [currentUser.id]);

  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.username}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">NEW <span className="text-amber-400">MESSAGE</span></h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800">✕</button>
        </div>
        <div className="p-4">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search followers…"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors mb-3"/>
          {loading && <p className="text-zinc-500 text-sm text-center py-4">Loading…</p>}
          {!loading && filtered.length===0 && (
            <div className="text-center py-6">
              <p className="text-zinc-500 text-sm">{query ? "No users found" : "No followers or following yet"}</p>
              <p className="text-zinc-600 text-xs mt-1">You can only message people you follow or who follow you</p>
            </div>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filtered.map((u,i)=>(
              <button key={i} onClick={()=>onOpen(u)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-colors text-left">
                <Avatar user={u} size="md" ring/>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{u.firstName} {u.lastName}</p>
                  <p className="text-zinc-500 text-xs">@{u.username}{u.instruments?.length>0&&` · ${u.instruments[0]}`}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CHAT WINDOW ───────────────────────────────────────────────────────────────
function ChatWindow({ conversation, currentUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();
  const pollRef = useRef();

  const other = conversation.other;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/messages/${conversation.id}`, {
        headers:{ Authorization:`Bearer ${token()}` }
      });
      const data = await res.json();
      if(data.success) setMessages(data.data);
    } catch {}
  }, [conversation.id]);

  useEffect(() => {
    setLoading(true);
    fetchMessages().finally(()=>setLoading(false));
    // Poll for new messages every 3 seconds
    pollRef.current = setInterval(fetchMessages, 3000);
    return ()=>clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const send = async () => {
    if(!text.trim()||sending) return;
    setSending(true);
    const optimistic = { id:`temp-${Date.now()}`, content:text.trim(), senderId:currentUser.id, sender:currentUser, createdAt:new Date().toISOString(), read:false };
    setMessages(m=>[...m,optimistic]);
    setText("");
    try {
      const res = await fetch(`${API_BASE}/messages/send`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token()}` },
        body: JSON.stringify({ conversationId: conversation.id, content: optimistic.content })
      });
      const data = await res.json();
      if(data.success) {
        setMessages(m=>m.map(msg=>msg.id===optimistic.id ? data.data.message : msg));
      } else {
        setMessages(m=>m.filter(msg=>msg.id!==optimistic.id));
        alert("Failed to send: " + data.message);
      }
    } catch(e) {
      setMessages(m=>m.filter(msg=>msg.id!==optimistic.id));
      alert("Error: " + e.message);
    }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const deleteMsg = async (msgId) => {
    try {
      await fetch(`${API_BASE}/messages/${msgId}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token()}` } });
      setMessages(m=>m.filter(msg=>msg.id!==msgId));
    } catch {}
  };

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const day = new Date(msg.createdAt).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
    if(!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
        <button onClick={onBack} className="lg:hidden text-zinc-400 hover:text-white p-1 mr-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <Avatar user={other} size="md" ring/>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{other?.firstName} {other?.lastName}</p>
          <p className="text-zinc-500 text-xs">@{other?.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="flex items-end gap-[3px] h-6">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.1}s ease-in-out infinite alternate`}}/>)}</div>
          </div>
        )}
        {!loading && messages.length===0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎵</div>
            <p className="text-zinc-400 font-medium">Start the conversation!</p>
            <p className="text-zinc-600 text-sm mt-1">Say hi to {other?.firstName}</p>
          </div>
        )}

        {Object.entries(grouped).map(([day, msgs])=>(
          <div key={day}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-zinc-800"/>
              <span className="text-zinc-600 text-xs">{day}</span>
              <div className="flex-1 h-px bg-zinc-800"/>
            </div>
            <div className="space-y-2">
              {msgs.map((msg, i) => {
                const isMe = msg.senderId === currentUser.id;
                const showAvatar = !isMe && (i===0 || msgs[i-1]?.senderId !== msg.senderId);
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe?"justify-end":"justify-start"}`}>
                    {!isMe && (
                      <div className="w-8 flex-shrink-0">
                        {showAvatar && <Avatar user={other} size="sm"/>}
                      </div>
                    )}
                    <div className={`group relative max-w-[70%]`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-amber-400 text-zinc-900 rounded-br-sm"
                          : "bg-zinc-800 text-white rounded-bl-sm"
                      } ${msg.id.startsWith("temp-")?"opacity-70":""}`}>
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMe?"justify-end":"justify-start"}`}>
                        <span className="text-zinc-600 text-[10px]">{timeAgo(msg.createdAt)}</span>
                        {isMe && <span className="text-zinc-600 text-[10px]">{msg.read?"· seen":""}</span>}
                      </div>
                      {isMe && !msg.id.startsWith("temp-") && (
                        <button onClick={()=>deleteMsg(msg.id)}
                          className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800 flex items-end gap-3 flex-shrink-0">
        <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-2.5 focus-within:border-amber-400 transition-colors">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }}
            placeholder={`Message ${other?.firstName}…`}
            rows={1}
            className="w-full bg-transparent text-white text-sm placeholder-zinc-500 outline-none resize-none leading-relaxed max-h-32"
            style={{overflow:"hidden"}}
            onInput={e=>{ e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
          />
        </div>
        <button onClick={send} disabled={!text.trim()||sending}
          className="w-10 h-10 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-zinc-900 rounded-full flex items-center justify-center transition-all flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── CONVERSATION LIST ─────────────────────────────────────────────────────────
function ConversationList({ conversations, activeId, onSelect, loading }) {
  if(loading) return (
    <div className="flex justify-center py-8">
      <div className="flex items-end gap-[3px] h-6">{[1,2,3,4,5].map(i=><div key={i} className="w-[3px] bg-amber-400 rounded-full h-full" style={{animation:`bb ${.5+i*.1}s ease-in-out infinite alternate`}}/>)}</div>
    </div>
  );

  if(conversations.length===0) return (
    <div className="text-center py-12 px-4">
      <div className="text-4xl mb-3">💬</div>
      <p className="text-zinc-400 font-medium text-sm">No messages yet</p>
      <p className="text-zinc-600 text-xs mt-1">Start a conversation with someone you follow</p>
    </div>
  );

  return (
    <div className="divide-y divide-zinc-800/50">
      {conversations.map(conv=>(
        <button key={conv.id} onClick={()=>onSelect(conv)}
          className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800/50 transition-colors text-left ${activeId===conv.id?"bg-zinc-800/70 border-r-2 border-amber-400":""}`}>
          <div className="relative">
            <Avatar user={conv.other} size="md" ring={activeId===conv.id}/>
            {conv.unreadCount>0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-zinc-900 text-[10px] font-bold rounded-full flex items-center justify-center">{conv.unreadCount}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={`text-sm font-semibold truncate ${conv.unreadCount>0?"text-white":"text-zinc-300"}`}>
                {conv.other?.firstName} {conv.other?.lastName}
              </p>
              {conv.lastMessage && <span className="text-zinc-600 text-xs flex-shrink-0 ml-2">{timeAgo(conv.lastMessage.createdAt)}</span>}
            </div>
            <p className={`text-xs truncate mt-0.5 ${conv.unreadCount>0?"text-zinc-300 font-medium":"text-zinc-500"}`}>
              {conv.lastMessage?.content || "Start a conversation"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── MAIN MESSAGES PAGE ────────────────────────────────────────────────────────
export default function MessagesPage({ currentUser, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/messages/conversations`, {
        headers:{ Authorization:`Bearer ${token()}` }
      });
      const data = await res.json();
      if(data.success) setConversations(data.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadConversations();
    const iv = setInterval(loadConversations, 5000);
    return ()=>clearInterval(iv);
  }, [loadConversations]);

  const openOrCreateConversation = async (otherUser) => {
    setShowNew(false);
    console.log("[MSG] openOrCreateConversation", otherUser);
    // Check if conversation already exists
    const existing = conversations.find(c => c.other?.id === otherUser.id);
    console.log("[MSG] existing conv:", existing);
    if(existing) { setActiveConv(existing); return; }

    // Create by sending a placeholder — backend will create conversation
    try {
      console.log("[MSG] sending POST /messages/send to", otherUser.id);
      const res = await fetch(`${API_BASE}/messages/send`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token()}` },
        body: JSON.stringify({ receiverId: otherUser.id, content: "👋" })
      });
      console.log("[MSG] response status:", res.status);
      const data = await res.json();
      console.log("[MSG] response data:", data);
      if(data.success) {
        await loadConversations();
        // Find the new conversation
        const newConvs = await fetch(`${API_BASE}/messages/conversations`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json());
        console.log("[MSG] newConvs:", newConvs);
        if(newConvs.success) {
          setConversations(newConvs.data);
          const conv = newConvs.data.find(c=>c.other?.id===otherUser.id);
          console.log("[MSG] found conv:", conv);
          if(conv) setActiveConv(conv);
        }
      } else {
        alert("Couldn't start conversation: " + data.message);
      }
    } catch(e) {
      console.error("[MSG] error:", e);
      alert("Couldn't start conversation: "+e.message);
    }
  };

  const totalUnread = conversations.reduce((sum,c)=>sum+c.unreadCount,0);

  return (
    <>
      <style>{`@keyframes bb{from{transform:scaleY(.3);opacity:.5}to{transform:scaleY(1);opacity:1}}.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      {showNew && <NewConversationModal currentUser={currentUser} onClose={()=>setShowNew(false)} onOpen={openOrCreateConversation}/>}

      <div className="flex h-screen bg-zinc-950 text-white">
        {/* Left panel — conversation list */}
        <div className={`${activeConv?"hidden lg:flex":"flex"} flex-col w-full lg:w-80 xl:w-96 border-r border-zinc-800 bg-zinc-900 flex-shrink-0`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="15,18 9,12 15,6"/></svg>
              </button>
              <h1 className="font-['Bebas_Neue'] text-xl text-white tracking-wide">
                MESSAGES {totalUnread>0&&<span className="text-amber-400">({totalUnread})</span>}
              </h1>
            </div>
            <button onClick={()=>setShowNew(true)}
              className="w-9 h-9 bg-amber-400 hover:bg-amber-300 text-zinc-900 rounded-full flex items-center justify-center transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <ConversationList
              conversations={conversations}
              activeId={activeConv?.id}
              onSelect={setActiveConv}
              loading={loading}
            />
          </div>
        </div>

        {/* Right panel — chat */}
        <div className={`${activeConv?"flex":"hidden lg:flex"} flex-col flex-1`}>
          {activeConv ? (
            <ChatWindow
              key={activeConv.id}
              conversation={activeConv}
              currentUser={currentUser}
              onBack={()=>setActiveConv(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-zinc-600">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-2">YOUR MESSAGES</h2>
              <p className="text-zinc-500 text-sm mb-6">Send private messages to people you follow</p>
              <button onClick={()=>setShowNew(true)}
                className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
                New Message
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
