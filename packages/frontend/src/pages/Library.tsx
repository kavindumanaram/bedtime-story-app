import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Play, User, Palette, Clock, BookOpen, Sparkles, Plus, Search, Heart, Trash2, GitBranch } from "lucide-react";
import { loadStories, deleteStory, type GeneratedStory } from "../api/storyDb";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl overflow-hidden animate-pulse"
      style={{ background: '#fff', border: '1.5px solid #E5E7EB' }}>
      <div className="w-full aspect-[4/3] bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-50 rounded-full w-full" />
        <div className="h-3 bg-gray-50 rounded-full w-2/3" />
        <div className="h-9 bg-gray-100 rounded-2xl mt-3" />
      </div>
    </div>
  );
}

/** Priority: coverImage → images[0] → null (shows gradient placeholder). */
export function pickThumb(story: GeneratedStory, imgError: boolean): string | null {
  if (imgError) return null;
  if (story.coverImage) return story.coverImage;
  if (story.images?.[0]) return story.images[0];
  return null;
}

function StoryCard({ story, isLoved, onDelete }: { story: GeneratedStory; isLoved: boolean; onDelete: () => void }) {
  const { openPlayer } = usePlayer();
  const [imgError, setImgError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const thumb = pickThumb(story, imgError);

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
    }
  }

  return (
    <div
      onClick={() => openPlayer(story.id)}
      onMouseLeave={() => setConfirmDelete(false)}
      className="group cursor-pointer flex flex-col"
      style={{
        borderRadius: 24, overflow: 'hidden',
        background: '#fff',
        border: '1.5px solid #E5E7EB',
        boxShadow: '0 2px 12px rgba(16,24,40,0.06)',
        transition: 'box-shadow 250ms, transform 250ms',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(16,24,40,0.14)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(16,24,40,0.06)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        setConfirmDelete(false);
      }}
    >
      {/* Cover image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
        {thumb ? (
          <img
            src={thumb}
            alt={story.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isLoved && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', color: '#f43f5e' }}>
              <Heart className="w-3 h-3 fill-rose-500" />
            </span>
          )}
          {story.is_branching && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: 'rgba(245,158,11,0.9)', backdropFilter: 'blur(6px)' }}>
              <GitBranch className="w-3 h-3" />
              Interactive
            </span>
          )}
        </div>

        {/* Top-right actions */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all duration-150"
            style={confirmDelete
              ? { background: '#ef4444', color: '#fff' }
              : { background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', color: '#f87171' }
            }
          >
            <Trash2 className="w-3 h-3" />
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', color: '#7c3aed' }}>
            <Sparkles className="w-3 h-3" />
            AI
          </span>
        </div>

        {/* Hover play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}>
            <Play className="w-6 h-6 ml-0.5" style={{ color: '#0b1220' }} />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-black text-sm leading-snug line-clamp-2 mb-1" style={{ color: '#0b1220' }}>
            {story.title}
          </h3>
          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: '#9CA3AF' }}>
            {story.summary}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 text-xs" style={{ color: '#9CA3AF' }}>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#c4b5fd' }} />
            <span>{story.childName}, {story.age} yrs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#a5b4fc' }} />
            <span className="capitalize truncate">{story.theme}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#D1D5DB' }} />
            <span>{timeAgo(story.createdAt)}</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); openPlayer(story.id); }}
          className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-black text-white transition-all"
          style={{ background: '#0b1220', boxShadow: '0 4px 14px rgba(11,18,32,0.2)' }}
        >
          <Play className="w-4 h-4" />
          Play Story
        </button>
      </div>
    </div>
  );
}

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { children, activeChild } = useAuth();
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [childFilter, setChildFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "theme" | "loved">("newest");
  const [likedStoryIds, setLikedStoryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStories().then((s) => { setStories(s); setLoading(false); });
  }, []);

  useEffect(() => { setLikedStoryIds(new Set()); }, [activeChild]);

  const storyCountByChild = useMemo(() =>
    stories.reduce<Record<string, number>>((acc, s) => {
      acc[s.childName] = (acc[s.childName] ?? 0) + 1;
      return acc;
    }, {}),
  [stories]);

  const filtered = stories
    .filter((s) => childFilter === null || s.childName === childFilter)
    .filter((s) =>
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.theme.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortOrder === "theme") return a.theme.localeCompare(b.theme);
      if (sortOrder === "loved") return (likedStoryIds.has(b.id) ? 1 : 0) - (likedStoryIds.has(a.id) ? 1 : 0);
      return 0;
    });

  return (
    <div className="space-y-5">

      {/* ── Dark hero header ─────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f0e23,#1a1535,#0d1117)', minHeight: 160 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(124,58,237,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', left: '5%', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(6,182,212,0.2) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {['📚', '✨', '🌙'].map((ch, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${15 + i * 25}%`, right: `${8 + i * 10}%`,
            fontSize: 20 + i * 5, opacity: 0.5, pointerEvents: 'none',
            animation: `floatLib ${6 + i}s ease-in-out ${i * 0.8}s infinite`,
          }}>{ch}</div>
        ))}

        <div className="relative z-10 p-7 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)' }}>
              <BookOpen className="w-4 h-4" style={{ color: '#a78bfa' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(167,139,250,0.8)' }}>
              Collection
            </span>
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white font-black mb-0.5" style={{ fontSize: 'clamp(22px,4vw,30px)', letterSpacing: '-0.02em' }}>
                Story Library
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                {loading ? 'Loading…' : `${stories.length} AI-generated bedtime ${stories.length === 1 ? 'adventure' : 'adventures'}`}
              </p>
            </div>
            <button
              onClick={() => navigate("/create")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-black text-white transition-all flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow: '0 6px 20px rgba(124,58,237,0.4)' }}
            >
              <Plus className="w-4 h-4" />
              Create Story
            </button>
          </div>
        </div>
      </div>

      {/* ── Search + sort bar ────────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: '#fff', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(16,24,40,0.06)' }}>
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9CA3AF' }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or theme…"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none"
              style={{ background: '#F4F3F9', border: '1.5px solid #E5E7EB', color: '#374151' }}
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {(["newest", "theme", "loved"] as const).map((order) => (
              <button
                key={order}
                onClick={() => setSortOrder(order)}
                className="px-3 py-2.5 rounded-2xl text-xs font-bold transition-all"
                style={sortOrder === order
                  ? { background: '#0b1220', color: '#fff', boxShadow: '0 4px 14px rgba(11,18,32,0.2)' }
                  : { background: '#F4F3F9', color: '#6B7280', border: '1.5px solid #E5E7EB' }
                }
              >
                {order === "newest" ? "Newest" : order === "theme" ? "By Theme" : "❤ Loved"}
              </button>
            ))}
          </div>
        </div>

        {/* Child filter pills */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-4 pb-4">
            <button
              onClick={() => setChildFilter(null)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={childFilter === null
                ? { background: '#0b1220', color: '#fff' }
                : { background: '#F4F3F9', color: '#6B7280', border: '1.5px solid #E5E7EB' }
              }
            >
              All
            </button>
            {children.map((child) => {
              const active = childFilter === child.name;
              return (
                <button
                  key={child.id}
                  onClick={() => setChildFilter(active ? null : child.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={active
                    ? { background: child.avatar_color, color: '#fff', boxShadow: `0 4px 14px ${child.avatar_color}55` }
                    : { background: '#F4F3F9', color: '#6B7280', border: '1.5px solid #E5E7EB' }
                  }
                >
                  <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-black"
                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.35)' : child.avatar_color }}>
                    {child.name[0].toUpperCase()}
                  </span>
                  {child.name}
                  <span className="opacity-60">
                    {storyCountByChild[child.name] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Loading skeletons ────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-3xl flex flex-col items-center justify-center py-20 text-center"
          style={{ background: '#fff', border: '1.5px solid #E5E7EB', boxShadow: '0 2px 12px rgba(16,24,40,0.06)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(124,58,237,0.08)' }}>
            <Sparkles className="w-8 h-8" style={{ color: '#a78bfa' }} />
          </div>
          <h2 className="font-black text-[#0b1220] mb-1" style={{ fontSize: 17 }}>
            {childFilter ? `No stories for ${childFilter} yet` : "No stories yet"}
          </h2>
          <p className="text-sm mb-6 max-w-xs" style={{ color: '#9CA3AF' }}>
            {childFilter
              ? `Generate a story for ${childFilter} on the Create page.`
              : "Head to Create and generate your first AI bedtime story."}
          </p>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white transition-all"
            style={{ background: '#0b1220', boxShadow: '0 6px 20px rgba(11,18,32,0.2)' }}
          >
            <Sparkles className="w-4 h-4" />
            {childFilter ? `Create story for ${childFilter}` : "Generate your first story"}
          </button>
        </div>
      )}

      {/* ── Story grid ───────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              isLoved={likedStoryIds.has(story.id)}
              onDelete={async () => {
                await deleteStory(story.id);
                setStories(prev => prev.filter(s => s.id !== story.id));
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes floatLib {
          0%,100% { transform: translateY(0px) rotate(-4deg); }
          50%      { transform: translateY(-14px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
