import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, User, Palette, Clock, BookOpen, Sparkles, Plus } from "lucide-react";
import { loadStories, type GeneratedStory } from "../api/storyDb";
import { useAuth } from "../contexts/AuthContext";

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
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm animate-pulse">
      <div className="w-full aspect-[4/3] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-8 bg-gray-200 rounded-lg mt-4" />
      </div>
    </div>
  );
}

function StoryCard({ story }: { story: GeneratedStory }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => navigate(`/player/${story.id}`)}
      className="group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Cover image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        {!imgError && story.coverImage ? (
          <img
            src={story.coverImage}
            alt={story.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-400 via-purple-400 to-indigo-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-purple-700">
          <Sparkles className="w-3 h-3" />
          AI
        </span>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-purple-700 ml-1" />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
            {story.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {story.summary}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span>{story.childName}, {story.age} yrs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="capitalize truncate">{story.theme}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{timeAgo(story.createdAt)}</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/player/${story.id}`); }}
          className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
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
  const { children } = useAuth();
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [childFilter, setChildFilter] = useState<string | null>(null);

  useEffect(() => {
    loadStories().then((s) => {
      setStories(s);
      setLoading(false);
    });
  }, []);

  const filtered = childFilter
    ? stories.filter((s) => s.childName === childFilter)
    : stories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Story Library</h1>
          <p className="text-gray-500 text-sm">Your collection of AI-generated bedtime adventures</p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && stories.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-full">
              <BookOpen className="w-4 h-4" />
              {filtered.length} {filtered.length === 1 ? "story" : "stories"}
            </span>
          )}
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Story
          </button>
        </div>
      </div>

      {/* Child filter pills */}
      {children.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setChildFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              childFilter === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setChildFilter(childFilter === child.name ? null : child.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                childFilter === child.name ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={childFilter === child.name ? { backgroundColor: child.avatar_color } : undefined}
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: childFilter === child.name ? 'rgba(255,255,255,0.3)' : child.avatar_color }}
              >
                {child.name[0].toUpperCase()}
              </span>
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-9 h-9 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {childFilter ? `No stories for ${childFilter} yet` : "No stories yet"}
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mb-6">
            {childFilter
              ? `Generate a story for ${childFilter} on the Create page.`
              : "Head to Create and generate your first AI bedtime story."}
          </p>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            {childFilter ? `Create story for ${childFilter}` : "Generate your first story"}
          </button>
        </div>
      )}

      {/* Story grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
};
