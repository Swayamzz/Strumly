import { useState, useEffect } from "react";
import toast from "./toast";

const API_BASE = "http://localhost:5000/api";
const MEDIA_BASE = "http://localhost:5000";
const token = () => localStorage.getItem("strumly_token");
const AVATAR_COLORS = ["from-amber-400 to-orange-500","from-rose-400 to-pink-600","from-violet-400 to-purple-600","from-cyan-400 to-blue-600","from-emerald-400 to-teal-600","from-red-400 to-rose-600"];

function timeAgo(d){const s=(Date.now()-new Date(d))/1000;if(s<60)return"just now";if(s<3600)return Math.floor(s/60)+"m";if(s<86400)return Math.floor(s/3600)+"h";return Math.floor(s/86400)+"d";}
function Avatar({user,size="md"}){const m={sm:"w-8 h-8 text-xs",md:"w-10 h-10 text-sm",lg:"w-14 h-14 text-base"};const c=(user?.username||"").charCodeAt(0)%AVATAR_COLORS.length;if(user?.profilePicture)return(<img src={`${MEDIA_BASE}${user.profilePicture}`} alt="" className={`${m[size]} rounded-full object-cover flex-shrink-0`}/>);return(<div className={`${m[size]} rounded-full bg-gradient-to-br ${AVATAR_COLORS[c]} flex items-center justify-center font-bold text-white flex-shrink-0`}>{((user?.firstName||user?.username||"?")[0]).toUpperCase()}</div>);}

const BmIcon = ({f}) => (
  <svg viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>
);
const HeartIcon = ({f}) => (
  <svg viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

function SavedPostCard({ savedPost, onUnsave }) {
  const post = savedPost.post;
  const [liked, setLiked] = useState(!!post?.isLiked);
  const [likes, setLikes] = useState(post?._count?.likes || 0);
  const media = post?.media?.[0] || null;

  const toggleLike = async () => {
    setLiked(l => !l);
    setLikes(c => liked ? c - 1 : c + 1);
    try {
      const r = await fetch(`${API_BASE}/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` }
      });
      const d = await r.json();
      if (d.success) setLikes(d.likes);
    } catch (e) {}
  };

  const unsave = async () => {
    try {
      await fetch(`${API_BASE}/bookmarks/${post.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` }
      });
      onUnsave(savedPost.id);
    } catch (e) {
      toast.error("Failed to unsave");
    }
  };

  if (!post) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar user={post.author} size="md" />
          <div>
            <p className="text-white text-sm font-semibold">{post.author?.firstName} {post.author?.lastName}</p>
            <p className="text-zinc-500 text-xs">@{post.author?.username} · {timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <button onClick={unsave} className="text-amber-400 hover:text-zinc-400 transition-colors" title="Remove bookmark">
          <BmIcon f={true} />
        </button>
      </div>

      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-zinc-200 text-sm leading-relaxed">{post.content}</p>
        </div>
      )}

      {media && (
        <div className="bg-zinc-800">
          {media.type === "VIDEO"
            ? <video src={`${MEDIA_BASE}${media.url}`} controls className="w-full max-h-72 object-cover"/>
            : <img src={`${MEDIA_BASE}${media.url}`} alt="" className="w-full max-h-72 object-cover"/>
          }
        </div>
      )}

      <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-4">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-rose-400" : "text-zinc-400 hover:text-rose-400"}`}>
          <HeartIcon f={liked} />
          <span>{likes}</span>
        </button>
        <span className="text-zinc-600 text-xs">Saved {timeAgo(savedPost.savedAt)}</span>
      </div>
    </div>
  );
}

export default function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/bookmarks`, {
      headers: { Authorization: `Bearer ${token()}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) setSavedPosts(d.data);
      })
      .catch(() => toast.error("Failed to load saved posts"))
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = (savedId) => {
    setSavedPosts(prev => prev.filter(sp => sp.id !== savedId));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-['Bebas_Neue'] text-3xl text-white tracking-wider">SAVED POSTS</h1>
        <p className="text-zinc-500 text-sm mt-1">{savedPosts.length} saved {savedPosts.length === 1 ? "post" : "posts"}</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"/>
        </div>
      )}

      {!loading && savedPosts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-zinc-600 mb-3">
            <BmIcon f={false} />
          </div>
          <p className="text-zinc-500">No saved posts yet</p>
          <p className="text-zinc-600 text-sm mt-1">Bookmark posts from your feed to see them here</p>
        </div>
      )}

      <div className="space-y-4">
        {savedPosts.map(sp => (
          <SavedPostCard key={sp.id} savedPost={sp} onUnsave={handleUnsave} />
        ))}
      </div>
    </div>
  );
}
