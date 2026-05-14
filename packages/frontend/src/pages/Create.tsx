import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePlayer } from "../contexts/PlayerContext";
import {
  Sparkles,
  Moon,
  Scissors,
  Wand2,
  CheckCircle2,
  Play,
  AlertCircle,
  ArrowRight,
  Star,
  BookOpen,
  GitBranch,
} from "lucide-react";
import { generateStory, generateCoverImage, extractStoryCharacters } from "../api/openaiApi";
import { saveStory, updateStoryCoverUrl, updateStoryCharacterContext, type GeneratedStory } from "../api/storyDb";
import { triggerContinuation } from "../api/storyContinuation";
import { getMemoryContext, getTopCharacters } from "../api/storyMemory";
import { PlanLimitError } from "../api/dailyStory";
import { buildStoryContext, buildConsistentSceneSlots, getFallbackImage, type SceneSlot, type StoryContext } from "../api/sceneImageApi";
import { getDevSettings } from "../lib/devSettings";
import { useAuth } from "../contexts/AuthContext";
import type { MemoryContext } from "../api/storyMemory";
import { GenerationProgress } from "../components/GenerationProgress";

type CreateState = "idle" | "writing" | "done";
type StoryMode = "new" | "narrative" | "continue" | "character";

const MODE_LABELS: Record<StoryMode, string> = {
  new: "Interactive",
  narrative: "Narrative",
  continue: "Continue",
  character: "Favourite Character",
};

const MODE_META: Record<StoryMode, { emoji: string; desc: string }> = {
  new:       { emoji: "⚡", desc: "Branching story with choices" },
  narrative: { emoji: "📖", desc: "Classic linear bedtime story" },
  continue:  { emoji: "▶",  desc: "Pick up where you left off" },
  character: { emoji: "⭐", desc: "Story starring a favourite character" },
};

const quickPrompts = [
  { label: "Make it calmer", icon: Moon, theme: "calm and soothing" },
  { label: "Shorter story", icon: Scissors, theme: "very short and simple" },
  { label: "Add a dragon", icon: Wand2, suffix: " with a friendly dragon" },
];

const interactiveThemes = [
  { label: "Brave Knight", theme: "a brave knight facing three bold choices", emoji: "⚔️" },
  { label: "Enchanted Forest", theme: "magical forest with hidden paths to explore", emoji: "🌿" },
  { label: "Space Explorer", theme: "space explorer discovering unknown worlds", emoji: "🚀" },
  { label: "Dragon Keeper", theme: "befriending a young dragon with surprising decisions", emoji: "🐉" },
  { label: "Ocean Mystery", theme: "underwater adventure with brave choices", emoji: "🌊" },
  { label: "Fairy Kingdom", theme: "fairy kingdom with magical crossroads", emoji: "🧚" },
];


function DoneCard({ title, onPlay }: { title: string; onPlay: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
        <CheckCircle2 className="w-12 h-12 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-xl font-bold text-gray-900">"{title}" is ready!</p>
        <p className="text-sm text-gray-500">Redirecting to your story...</p>
      </div>
      <button
        onClick={onPlay}
        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors shadow-sm"
      >
        <Play className="w-4 h-4" />
        Play Story Now
      </button>
    </div>
  );
}

export const Create: React.FC = () => {
  const navigate = useNavigate();
  const { openPlayer } = usePlayer();
  const { activeChild, profile } = useAuth();

  const [createState, setCreateState] = useState<CreateState>("idle");
  const [storyMode, setStoryMode] = useState<StoryMode>("new");
  const [theme, setTheme] = useState("friendly dragon");
  const [error, setError] = useState<string | null>(null);
  const [createdStory, setCreatedStory] = useState<GeneratedStory | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [memory, setMemory] = useState<MemoryContext | null>(null);
  const [characters, setCharacters] = useState<{ name: string; description: string | null }[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [sceneSlots, setSceneSlots] = useState<SceneSlot[]>([]);
  const [storyCtx, setStoryCtx] = useState<StoryContext | null>(null);

  useEffect(() => {
    if (!activeChild) return;
    getMemoryContext(activeChild.id).then(setMemory).catch(() => null);
    getTopCharacters(activeChild.id, 5).then(setCharacters).catch(() => null);
  }, [activeChild]);

  useEffect(() => {
    if (createState === "done") {
      const target = createdId ?? (createdStory ? createdStory.id : null);
      if (target) {
        const timer = setTimeout(() => {
          openPlayer(target, {
            slots: sceneSlots,
            storyContext: storyCtx ?? undefined,
            paragraphCount: createdStory?.text.length ?? 0,
            childName: activeChild?.name ?? "",
            storyTitle: createdStory?.title ?? "",
            theme,
          });
        }, 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [createState, createdStory, createdId, navigate, sceneSlots, storyCtx, activeChild, profile]);

  const handleGenerate = async () => {
    if (!activeChild) return;
    setError(null);
    setCreatedStory(null);
    setCreatedId(null);
    setSceneSlots([]);
    setStoryCtx(null);

    try {
      setCreateState("writing");
      const story = await generateStory(
        activeChild.name,
        activeChild.age,
        theme,
        {
          tone: activeChild.preferences?.tone,
          length: activeChild.preferences?.length,
          narrative: storyMode === "narrative",
        },
      );

      // Extract rich character context via AI, then build scene config
      const [topChars, extractedChars] = await Promise.all([
        getTopCharacters(activeChild.id, 3).catch(() => []),
        extractStoryCharacters(story.title, story.text).catch(() => []),
      ]);
      const ctx = buildStoryContext(story.title, story.summary, story.text, topChars, extractedChars);
      const { imagesPerStory } = getDevSettings();
      const slots = buildConsistentSceneSlots(story.text, ctx, imagesPerStory);
      setSceneSlots(slots);
      setStoryCtx(ctx);

      // Save story text immediately — no images yet
      const saved: GeneratedStory = {
        id: String(Date.now()),
        title: story.title,
        summary: story.summary,
        text: story.text,  // root paragraphs for Library display + Player fallback
        coverImage: "",
        images: [],
        childName: activeChild.name,
        age: activeChild.age,
        theme,
        createdAt: new Date().toISOString(),
        characterContext: extractedChars.length > 0 ? extractedChars : undefined,
        is_branching: story.is_branching,
        story_graph: story.story_graph,
      };
      await saveStory(saved);
      setCreatedStory(saved);

      // Best-effort: persist character context to Supabase for UUID-based stories
      if (extractedChars.length > 0) {
        updateStoryCharacterContext(saved.id, extractedChars).catch(() => {});
      }

      // Background: generate cover image for Library thumbnail (non-blocking).
      // On any failure (moderation_blocked, network, etc.) fall back to a themed gradient.
      if (profile?.plan !== "free") {
        generateCoverImage(story.title, story.summary)
          .then((url) => updateStoryCoverUrl(saved.id, url))
          .catch(() => {
            updateStoryCoverUrl(saved.id, getFallbackImage(theme)).catch(() => {});
          });
      }

      setCreateState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setCreateState("idle");
    }
  };

  const handleContinue = async () => {
    if (!activeChild || !profile) return;
    setError(null);
    setCreatedId(null);
    try {
      setCreateState("writing");
      const storyId = await triggerContinuation(activeChild, profile);
      setCreatedId(storyId);
      setCreateState("done");
    } catch (e) {
      if (e instanceof PlanLimitError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Generation failed");
      }
      setCreateState("idle");
    }
  };

  const handleCharacterGenerate = async () => {
    if (!activeChild) return;
    const characterTheme = selectedCharacter
      ? `a story with ${selectedCharacter}`
      : theme;
    setTheme(characterTheme);
    await handleGenerate();
  };

  const interestChips = activeChild?.preferences?.interests ?? [];
  const toneLabel = activeChild?.preferences?.tone ?? "calm";
  const lengthLabel = activeChild?.preferences?.length ?? "medium";

  const CREATE_KF = `
    @keyframes floatCreate {
      0%,100% { transform: translateY(0px) rotate(-4deg); }
      50%      { transform: translateY(-16px) rotate(5deg); }
    }
    @keyframes glowPulse {
      0%,100% { box-shadow: 0 0 20px 4px rgba(124,58,237,0.4); }
      50%      { box-shadow: 0 0 40px 12px rgba(6,182,212,0.55); }
    }
  `;

  return (
    <div className="space-y-5">
      <style>{CREATE_KF}</style>

      {/* ── Dark hero header ───────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f0e23,#1a1535,#0d1117)', minHeight: 180 }}>
        {/* Glow orbs */}
        <div style={{ position:'absolute', top:'-20%', right:'-5%', width:260, height:260, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(124,58,237,0.4) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-20%', left:'10%', width:200, height:200, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(6,182,212,0.3) 0%,transparent 70%)', pointerEvents:'none' }} />

        {/* Floating emojis */}
        {[
          { ch:'✨', top:'12%', right:'18%', size:28, dur:'6s', delay:'0s' },
          { ch:'🌙', top:'55%', right:'8%',  size:36, dur:'8s', delay:'1.2s' },
          { ch:'⭐', top:'20%', right:'35%', size:18, dur:'5s', delay:'0.8s' },
        ].map((d, i) => (
          <div key={i} style={{
            position:'absolute', top:d.top, right:d.right, fontSize:d.size,
            opacity:0.7, pointerEvents:'none', userSelect:'none',
            animation:`floatCreate ${d.dur} ease-in-out ${d.delay} infinite`,
          }}>{d.ch}</div>
        ))}

        <div className="relative z-10 p-7 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background:'rgba(245,183,49,0.15)', border:'1px solid rgba(245,183,49,0.35)' }}>
              <Sparkles className="w-4 h-4" style={{ color:'#F5B731' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'rgba(245,183,49,0.8)' }}>
              Story Studio
            </span>
          </div>
          <h1 className="text-white font-black mb-1" style={{ fontSize:'clamp(22px,4vw,32px)', letterSpacing:'-0.02em' }}>
            Create a Story
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13 }}>
            Generate a personalised bedtime adventure for {activeChild?.name ?? 'your child'}
          </p>
        </div>
      </div>

      {/* ── Content card ────────────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background:'#fff', boxShadow:'0 4px 32px rgba(16,24,40,0.08)', border:'1px solid rgba(124,58,237,0.07)' }}>

        {createState === "writing" && (
          <div className="p-6 lg:p-8">
            <GenerationProgress phase="writing" coverImage={null} childName={activeChild?.name} />
          </div>
        )}

        {createState === "done" && (
          <div className="p-6 lg:p-8">
            <DoneCard
              title={createdStory?.title ?? "Your story"}
              onPlay={() => {
                const target = createdId ?? createdStory?.id;
                if (target) openPlayer(target);
              }}
            />
          </div>
        )}

        {createState === "idle" && (
          <div className="p-6 lg:p-8 space-y-6">

            {/* Story mode selector */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">Story Mode</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["new", "narrative", "continue", "character"] as StoryMode[]).map((mode) => {
                  const active = storyMode === mode;
                  const meta = MODE_META[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => { setStoryMode(mode); setError(null); }}
                      className="flex flex-col items-start gap-1 p-3 rounded-2xl text-left transition-all"
                      style={active
                        ? { background:'linear-gradient(135deg,#7c3aed,#06b6d4)', color:'#fff', boxShadow:'0 4px 14px rgba(124,58,237,0.35)' }
                        : { background:'#F4F3F9', color:'#4B5563', border:'1.5px solid #E5E7EB' }
                      }
                    >
                      <span className="text-lg leading-none">{meta.emoji}</span>
                      <span className="text-sm font-bold leading-tight">{MODE_LABELS[mode]}</span>
                      <span className="text-[10px] leading-tight" style={{ color: active ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                        {meta.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active child banner */}
            {activeChild ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(6,182,212,0.04))', border:'1.5px solid rgba(124,58,237,0.12)' }}>
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md"
                  style={{ background: activeChild.avatar_color }}>
                  {activeChild.name[0].toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0b1220]">{activeChild.name}, age {activeChild.age}</p>
                  <p className="text-xs capitalize" style={{ color:'#9CA3AF' }}>{toneLabel} · {lengthLabel}</p>
                </div>
                <Link to="/profile"
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                  style={{ color:'#7c3aed', background:'rgba(124,58,237,0.08)' }}>
                  Switch →
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background:'rgba(245,183,49,0.08)', border:'1.5px solid rgba(245,183,49,0.3)', color:'#92400e' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color:'#F5B731' }} />
                <p className="text-sm">
                  Select a child in the sidebar or{" "}
                  <Link to="/profile" className="font-semibold underline">add a child profile</Link>{" "}
                  to continue.
                </p>
              </div>
            )}

            {/* Continue Previous: memory context banner */}
            {storyMode === "continue" && (
              memory ? (
                <div className="rounded-2xl p-4 space-y-1"
                  style={{ background:'rgba(124,58,237,0.05)', border:'1.5px solid rgba(124,58,237,0.15)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#7c3aed' }}>Last story</p>
                  <p className="text-sm font-bold text-[#0b1220]">{memory.lastTitle}</p>
                  {memory.lastSummary && (
                    <p className="text-xs line-clamp-2" style={{ color:'#6B7280' }}>{memory.lastSummary}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl p-4 text-center text-sm"
                  style={{ background:'#F4F3F9', border:'1.5px solid #E5E7EB', color:'#6B7280' }}>
                  No previous story found. Read a story first to unlock continuation.
                </div>
              )
            )}

            {/* Favourite Character: character picker */}
            {storyMode === "character" && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                  {characters.length > 0 ? "Choose a character" : "No characters yet"}
                </p>
                {characters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {characters.map((c) => (
                      <button key={c.name}
                        onClick={() => { setSelectedCharacter(c.name); setTheme(`a story with ${c.name}`); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={selectedCharacter === c.name
                          ? { background:'linear-gradient(135deg,#7c3aed,#06b6d4)', color:'#fff' }
                          : { background:'rgba(124,58,237,0.08)', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)' }
                        }>
                        <Star className="w-3.5 h-3.5" />
                        {c.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color:'#9CA3AF' }}>
                    Characters appear here after children read stories with recurring characters.
                  </p>
                )}
              </div>
            )}

            {/* Theme input */}
            {storyMode !== "continue" && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">Theme</p>
                <input
                  value={theme}
                  onChange={(e) => { setTheme(e.target.value); setSelectedCharacter(null); }}
                  placeholder="e.g. friendly dragon"
                  className="w-full px-4 py-3 rounded-2xl text-sm text-[#0b1220] placeholder-[#9CA3AF] outline-none transition-all"
                  style={{ background:'#F4F3F9', border:'1.5px solid #E5E7EB' }}
                  onFocus={e => { e.currentTarget.style.borderColor='rgba(124,58,237,0.5)'; e.currentTarget.style.background='#fff'; }}
                  onBlur={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.background='#F4F3F9'; }}
                />
              </div>
            )}

            {/* Quick themes — interactive story ideas */}
            {storyMode === "new" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" style={{ color:'#7c3aed' }} />
                  <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">Interactive story ideas</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interactiveThemes.map((t) => (
                    <button key={t.label} onClick={() => setTheme(t.theme)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={theme === t.theme
                        ? { background:'linear-gradient(135deg,#7c3aed,#06b6d4)', color:'#fff' }
                        : { background:'rgba(124,58,237,0.07)', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.18)' }
                      }>
                      <span>{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick themes — narrative story modifiers */}
            {storyMode === "narrative" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" style={{ color:'#6B7280' }} />
                  <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">Quick themes</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interestChips.map((interest) => (
                    <button key={interest} onClick={() => setTheme(interest)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background:'rgba(124,58,237,0.08)', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.15)' }}>
                      {interest}
                    </button>
                  ))}
                  {quickPrompts.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <button key={chip.label}
                        onClick={() => setTheme(chip.theme ?? `${theme}${chip.suffix ?? ""}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background:'#F4F3F9', color:'#4B5563', border:'1px solid #E5E7EB' }}>
                        <Icon className="w-3 h-3" />
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm px-4 py-3 rounded-2xl"
                style={{ color:'#dc2626', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  {error}
                  {error.toLowerCase().includes("upgrade") && (
                    <> <button onClick={() => navigate("/billing")} className="underline font-semibold">Upgrade →</button></>
                  )}
                </span>
              </div>
            )}

            {/* Generate / Continue button */}
            <button
              onClick={storyMode === "continue" ? handleContinue : storyMode === "character" ? handleCharacterGenerate : handleGenerate}
              disabled={!activeChild || (storyMode === "continue" && (!profile || !memory))}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background:'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow:'0 8px 24px rgba(124,58,237,0.4)', animation:'glowPulse 3s ease-in-out infinite' }}
            >
              {storyMode === "continue"
                ? <><ArrowRight className="w-5 h-5" />Continue Story</>
                : <><Sparkles className="w-5 h-5" />Generate Story</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
