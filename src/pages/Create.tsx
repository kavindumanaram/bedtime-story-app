import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  Moon,
  Scissors,
  Wand2,
  MapPin,
  CheckCircle2,
  Play,
  AlertCircle,
  ArrowRight,
  Star,
} from "lucide-react";
import { generateStory, generateCoverImage } from "../api/openaiApi";
import { saveStory, updateStoryCoverUrl, type GeneratedStory } from "../api/storyDb";
import { triggerContinuation } from "../api/storyContinuation";
import { getMemoryContext, getTopCharacters } from "../api/storyMemory";
import { PlanLimitError } from "../api/dailyStory";
import { buildStyleContext, buildScenePrompts, getFallbackImage, type SceneSlot } from "../api/sceneImageApi";
import { useAuth } from "../contexts/AuthContext";
import type { MemoryContext } from "../api/storyMemory";
import { GenerationProgress } from "../components/GenerationProgress";

type CreateState = "idle" | "writing" | "done";
type StoryMode = "new" | "continue" | "character";

const MODE_LABELS: Record<StoryMode, string> = {
  new: "New Story",
  continue: "Continue Previous",
  character: "Favourite Character",
};

const quickPrompts = [
  { label: "Make it calmer", icon: Moon, theme: "calm and soothing" },
  { label: "Shorter story", icon: Scissors, theme: "very short and simple" },
  { label: "Add a dragon", icon: Wand2, suffix: " with a friendly dragon" },
  { label: "Sri Lankan setting", icon: MapPin, theme: "set in Sri Lanka" },
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
          navigate(`/player/${target}`, {
            state: {
              slots: sceneSlots,
              paragraphCount: createdStory?.text.length ?? 0,
              childName: activeChild?.name ?? "",
              storyTitle: createdStory?.title ?? "",
              theme,
            },
          });
        }, 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [createState, createdStory, createdId, navigate, sceneSlots, activeChild, profile]);

  const handleGenerate = async () => {
    if (!activeChild) return;
    setError(null);
    setCreatedStory(null);
    setCreatedId(null);
    setSceneSlots([]);

    try {
      setCreateState("writing");
      const story = await generateStory(
        activeChild.name,
        activeChild.age,
        theme,
        {
          tone: activeChild.preferences?.tone,
          length: activeChild.preferences?.length,
        },
      );

      // Build scene generation config (instant, local)
      const topChars = await getTopCharacters(activeChild.id, 3).catch(() => []);
      const styleCtx = buildStyleContext(story.title, story.summary, topChars);
      const slots = buildScenePrompts(story.text, styleCtx);
      setSceneSlots(slots);

      // Save story text immediately — no images yet
      const saved: GeneratedStory = {
        id: String(Date.now()),
        title: story.title,
        summary: story.summary,
        text: story.text,
        coverImage: "",
        images: [],
        childName: activeChild.name,
        age: activeChild.age,
        theme,
        createdAt: new Date().toISOString(),
      };
      await saveStory(saved);
      setCreatedStory(saved);

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

  const idleTitle = storyMode === "continue"
    ? "Continue Yesterday's Story"
    : storyMode === "character"
      ? "Story with a Favourite Character"
      : "New Bedtime Story";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create a Story</h1>
        <p className="text-gray-500 text-sm">Generate a personalised bedtime adventure for your child</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
        {createState === "idle" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {idleTitle}
              </h2>
            </div>

            {/* Story Mode Selector */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Story Mode</p>
              <div className="flex flex-wrap gap-2">
                {(["new", "continue", "character"] as StoryMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setStoryMode(mode); setError(null); }}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                      storyMode === mode
                        ? "bg-primary text-white border-primary"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {mode === "new" && "🆕 "}
                    {mode === "continue" && "▶ "}
                    {mode === "character" && "⭐ "}
                    {MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            {/* Active child banner */}
            {activeChild ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: activeChild.avatar_color }}
                >
                  {activeChild.name[0].toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {activeChild.name}, age {activeChild.age}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {toneLabel} · {lengthLabel}
                  </p>
                </div>
                <Link
                  to="/profile"
                  className="text-xs text-primary hover:text-primary-dark font-medium transition-colors flex-shrink-0"
                >
                  Switch →
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Select a child in the sidebar or{" "}
                  <Link to="/profile" className="font-medium underline">add a child profile</Link>{" "}
                  to continue.
                </p>
              </div>
            )}

            {/* Continue Previous: memory context banner */}
            {storyMode === "continue" && (
              memory ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">Last story</p>
                  <p className="text-sm font-semibold text-gray-900">{memory.lastTitle}</p>
                  {memory.lastSummary && (
                    <p className="text-xs text-gray-500 line-clamp-2">{memory.lastSummary}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                  No previous story found. Read a story first to unlock continuation.
                </div>
              )
            )}

            {/* Favourite Character: character picker chips */}
            {storyMode === "character" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {characters.length > 0 ? "Choose a character" : "No characters yet"}
                </p>
                {characters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {characters.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          setSelectedCharacter(c.name);
                          setTheme(`a story with ${c.name}`);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                          selectedCharacter === c.name
                            ? "bg-primary text-white border-primary"
                            : "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                        {c.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    Characters appear here after children read stories with recurring characters.
                  </p>
                )}
              </div>
            )}

            {/* Theme input — shown for new and character modes */}
            {storyMode !== "continue" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Theme</span>
                <input
                  value={theme}
                  onChange={(e) => { setTheme(e.target.value); setSelectedCharacter(null); }}
                  placeholder="e.g. friendly dragon"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </label>
            )}

            {/* Quick prompt chips — shown for new mode */}
            {storyMode === "new" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick themes</p>
                <div className="flex flex-wrap gap-2">
                  {interestChips.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => setTheme(interest)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-sm transition-colors hover:bg-primary/10"
                    >
                      {interest}
                    </button>
                  ))}
                  {quickPrompts.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <button
                        key={chip.label}
                        onClick={() =>
                          setTheme(chip.theme ?? `${theme}${chip.suffix ?? ""}`)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-primary/5 hover:border-primary/30 text-gray-600 hover:text-primary text-sm transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  {error}
                  {error.toLowerCase().includes("upgrade") && (
                    <> <button onClick={() => navigate("/billing")} className="underline font-medium">Upgrade →</button></>
                  )}
                </span>
              </div>
            )}

            {/* Generate / Continue button */}
            {storyMode === "continue" ? (
              <button
                onClick={handleContinue}
                disabled={!activeChild || !profile || !memory}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                Continue Story
              </button>
            ) : storyMode === "character" ? (
              <button
                onClick={handleCharacterGenerate}
                disabled={!activeChild}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Story
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!activeChild}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Story
              </button>
            )}
          </div>
        )}

        {createState === "writing" && (
          <GenerationProgress phase="writing" coverImage={null} childName={activeChild?.name} />
        )}

        {createState === "done" && (
          <DoneCard
            title={createdStory?.title ?? "Your story"}
            onPlay={() => {
              const target = createdId ?? createdStory?.id;
              if (target) navigate(`/player/${target}`);
            }}
          />
        )}
      </div>
    </div>
  );
};
