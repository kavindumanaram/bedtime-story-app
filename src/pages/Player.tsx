import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles, Heart, AlertTriangle, Clock, Rabbit, Mountain, ArrowRight, Check,
  Play, X,
} from "lucide-react";
import { Badge } from "../components/Badge";
import LargeStoryPlayer from "../components/LargeStoryPlayer";
import { BedtimePreparationScreen } from "../components/BedtimePreparationScreen";
import { CartoonStoryIntro } from "../components/CartoonStoryIntro";
import { CinematicIntro } from "../components/CinematicIntro";
import { AudioControls, VOICE_PROFILES } from "../components/AudioControls";
import { stories } from "../data/mock";
import { loadStory } from "../api/storyDb";
import { supabase } from "../lib/supabase";
import { updateStreak } from "../api/dailyStory";
import { updateMemoryAfterRead, saveFeedback } from "../api/storyMemory";
import { useAuth } from "../contexts/AuthContext";
import { useProgressiveImages } from "../hooks/useProgressiveImages";
import type { SceneSlot } from "../api/sceneImageApi";
import type { FeedbackReaction } from "../lib/supabase";

const FEEDBACK_OPTIONS: { reaction: FeedbackReaction; icon: React.FC<{ className?: string }>; label: string }[] = [
  { reaction: "loved",          icon: Heart,          label: "Loved it" },
  { reaction: "too_scary",      icon: AlertTriangle,  label: "Too scary" },
  { reaction: "too_long",       icon: Clock,          label: "Too long" },
  { reaction: "more_animals",   icon: Rabbit,         label: "More animals" },
  { reaction: "more_adventure", icon: Mountain,       label: "More adventure" },
];

type RitualPhase = "preparation" | "intro" | "player";

type RouterState = {
  slots?: SceneSlot[];
  paragraphCount?: number;
  childName?: string;
  storyTitle?: string;
  theme?: string;
};

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeChild, profile } = useAuth();

  const routerState = (location.state ?? {}) as RouterState;

  const knownMock = stories.find((s) => s.id === id);
  const [currentStory, setCurrentStory] = useState(knownMock ?? stories[0]);
  const [isLoading, setIsLoading] = useState(!knownMock);
  const [textPage, setTextPage] = useState(0);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const isNewStory = !!(routerState.childName && routerState.storyTitle);
  const [ritualPhase, setRitualPhase] = useState<RitualPhase>(
    isNewStory ? "preparation" : "player",
  );
  const [showOldIntro, setShowOldIntro] = useState(false);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [maxWaitElapsed, setMaxWaitElapsed] = useState(false);
  const [userSkipped, setUserSkipped] = useState(false);

  const [sceneSlots] = useState<SceneSlot[]>(routerState.slots ?? []);

  // Feedback state
  const [selectedReaction, setSelectedReaction] = useState<FeedbackReaction | null>(null);
  const [markedContinue, setMarkedContinue] = useState(false);
  const [streakUpdated, setStreakUpdated] = useState(false);

  // TTS controls
  const [ttsSpeed, setTtsSpeed] = useState(0.95);
  const [ttsVoice, setTtsVoice] = useState(VOICE_PROFILES[0].id);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsSpeedRef = useRef(0.95);
  const ttsVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const ttsStartTimeRef = useRef<number | null>(null);
  const ttsEstDurationRef = useRef(0);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }

    loadStory(id).then(async (saved) => {
      if (saved) {
        setCurrentStory({ ...stories[0], ...saved, pages: saved.images ?? [saved.coverImage] });
        setIsLoading(false);
        return;
      }
      if (knownMock) { setIsLoading(false); return; }

      const { data } = await supabase.from("stories").select("*").eq("id", id).single();
      if (data) {
        setCurrentStory({
          ...stories[0],
          id: data.id,
          title: data.title,
          summary: data.summary ?? "",
          text: (data.paragraphs as string[]) ?? [],
          pages: (data.image_urls as string[] | null) ?? (data.cover_url ? [data.cover_url as string] : undefined),
          coverUrl: (data.cover_url as string | null) ?? stories[0].coverUrl,
        });
      }
      setIsLoading(false);
    });
  }, [id]);

  const paragraphs = currentStory.text ?? [];
  // Fallback: if story has no paragraph text, narrate from summary so AudioControls always works
  const narratableText = paragraphs.length > 0 ? paragraphs : (currentStory.summary ? [currentStory.summary] : []);

  // Progressive image generation — empty slots → hook does nothing
  const { images: progressiveImages, readyCount } = useProgressiveImages({
    slots: sceneSlots,
    paragraphCount: routerState.paragraphCount ?? paragraphs.length,
    storyId: id ?? null,
  });

  // Intro gating: keep prep/intro screens until MIN_READY_IMAGES are loaded
  const MIN_READY_IMAGES = 3;
  const MAX_WAIT_MS = 120_000;
  const readyToAdvance = isNewStory && (readyCount >= MIN_READY_IMAGES || maxWaitElapsed);

  // 120s absolute fallback — force past any ritual phase
  useEffect(() => {
    if (!isNewStory) return;
    const t = setTimeout(() => {
      setMaxWaitElapsed(true);
      setRitualPhase((p) => p !== "player" ? "player" : p);
    }, MAX_WAIT_MS);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Old stories: show brief CinematicIntro once loading finishes
  useEffect(() => {
    if (!isLoading && !isNewStory) {
      setShowOldIntro(true);
    }
  }, [isLoading, isNewStory]);

  // New stories: auto-start narration when ritual completes
  useEffect(() => {
    if (ritualPhase === "player" && isNewStory && narratableText.length > 0) {
      setTimeout(() => speakParagraph(narratableText[textPage]), 350);
    }
  // speakParagraph is stable (refs only); paragraphs won't change after load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ritualPhase]);

  // Auto-hide play prompt after 5 s
  useEffect(() => {
    if (!showPlayPrompt) return;
    const t = setTimeout(() => setShowPlayPrompt(false), 5000);
    return () => clearTimeout(t);
  }, [showPlayPrompt]);

  // Load TTS voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices().filter((v) => v.lang.startsWith("en")) ?? [];
      setAvailableVoices(voices);
    };
    loadVoices();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      return () => { window.speechSynthesis.onvoiceschanged = null; };
    }
  }, []);

  const stopTTS = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    ttsRef.current = null;
    ttsStartTimeRef.current = null;
    setIsTTSPlaying(false);
    setIsTTSLoading(false);
    setTtsProgress(0);
  };

  const speakParagraph = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    stopTTS();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = ttsSpeedRef.current;
    utter.lang = "en-US";
    if (ttsVoiceRef.current) utter.voice = ttsVoiceRef.current;
    utter.onstart = () => setIsTTSLoading(false);
    utter.onend = () => { setIsTTSPlaying(false); setIsTTSLoading(false); setTtsProgress(0); };
    utter.onerror = () => { setIsTTSPlaying(false); setIsTTSLoading(false); setTtsProgress(0); };
    ttsRef.current = utter;
    ttsStartTimeRef.current = Date.now();
    ttsEstDurationRef.current = (text.length / ttsSpeedRef.current) * 65;
    window.speechSynthesis.speak(utter);
    setIsTTSPlaying(true);
    setIsTTSLoading(true);
  };

  // Progress bar ticker
  useEffect(() => {
    if (!isTTSPlaying) { setTtsProgress(0); return; }
    const interval = setInterval(() => {
      if (!ttsStartTimeRef.current || !ttsEstDurationRef.current) return;
      const elapsed = Date.now() - ttsStartTimeRef.current;
      setTtsProgress(Math.min((elapsed / ttsEstDurationRef.current) * 100, 99));
    }, 300);
    return () => clearInterval(interval);
  }, [isTTSPlaying]);

  useEffect(() => { stopTTS(); }, [textPage]);
  useEffect(() => { return () => stopTTS(); }, []);

  const hasParagraphs = narratableText.length > 0;
  const isLastPage = hasParagraphs && textPage === narratableText.length - 1;

  useEffect(() => {
    if (isLastPage && !streakUpdated && activeChild && profile) {
      setStreakUpdated(true);
      updateStreak(activeChild.id, profile.id).catch(() => {/* non-blocking */});
    }
  }, [isLastPage, streakUpdated, activeChild, profile]);

  const handleFeedback = async (reaction: FeedbackReaction) => {
    if (!activeChild || !profile || !id) return;
    setSelectedReaction(reaction);
    const theme = (currentStory as any).theme ?? "adventure";
    await saveFeedback(id, activeChild.id, profile.id, reaction, theme).catch(() => {/* non-blocking */});
  };

  const handleContinueTomorrow = async () => {
    if (!activeChild || !profile || !id) return;
    setMarkedContinue(true);
    const lastP = paragraphs[paragraphs.length - 1] ?? "";
    const summary = (currentStory.summary as string | undefined) ?? "";
    await updateMemoryAfterRead(activeChild.id, profile.id, id, summary, lastP).catch(() => {/* non-blocking */});
  };

  const handleSpeedChange = (speed: number) => {
    ttsSpeedRef.current = speed;
    setTtsSpeed(speed);
  };

  const handleVoiceChange = (voiceId: string) => {
    setTtsVoice(voiceId);
    if (availableVoices.length === 0) { ttsVoiceRef.current = null; return; }
    const voiceProfile = VOICE_PROFILES.find((p) => p.id === voiceId);
    const matched = availableVoices.find((v) =>
      voiceProfile?.keywords.some((k) => v.name.toLowerCase().includes(k))
    );
    const idx = Math.max(0, VOICE_PROFILES.findIndex((p) => p.id === voiceId));
    ttsVoiceRef.current = matched ?? availableVoices[idx % availableVoices.length] ?? availableVoices[0] ?? null;
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "NEW": return "new" as const;
      case "POPULAR": return "popular" as const;
      case "DOWNLOADED": return "downloaded" as const;
      default: return "default" as const;
    }
  };

  // New-generation stories (slots present): always use progressiveImages so shimmer shows
  // while generating and images fill in as they arrive.
  // Revisited/cached stories (no slots): fall back to images stored in Supabase / local db.
  const carouselPages: (string | null)[] | undefined =
    sceneSlots.length > 0
      ? (progressiveImages.length > 0 ? progressiveImages : undefined)
      : ((currentStory as any).images?.length
          ? (currentStory as any).images
          : currentStory.pages?.length
            ? currentStory.pages
            : undefined);

  const ttsDurationSecs = hasParagraphs
    ? Math.max(1, Math.round(narratableText[textPage].length * 0.065 / ttsSpeed))
    : 0;
  const ttsDuration = `${Math.floor(ttsDurationSecs / 60)}:${String(ttsDurationSecs % 60).padStart(2, "0")}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </button>
        </div>
        <div className="px-4 lg:px-8 pb-10 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="aspect-[4/3] sm:aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-gray-300 animate-spin [animation-duration:3s]" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="h-7 bg-gray-200 animate-pulse rounded-lg w-2/3" />
            <div className="h-4 bg-gray-100 animate-pulse rounded-lg w-full" />
            <div className="h-4 bg-gray-100 animate-pulse rounded-lg w-4/5" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="h-4 bg-gray-200 animate-pulse rounded w-24" />
            <div className="space-y-2 min-h-[100px]">
              <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
              <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
              <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDimmed ? "bg-gray-950" : "bg-gray-50"}`}>
      {/* Phase 1: Bedtime preparation — waits for readyToAdvance AND minDurationMs */}
      {ritualPhase === "preparation" && (
        <BedtimePreparationScreen
          childName={routerState.childName ?? ""}
          storyTitle={routerState.storyTitle ?? currentStory.title}
          theme={routerState.theme ?? "adventure"}
          minDurationMs={35_000}
          readyToAdvance={readyToAdvance}
          skipAfterMs={10_000}
          onComplete={() => setRitualPhase("intro")}
          onSkip={() => { setUserSkipped(true); setRitualPhase("player"); setShowPlayPrompt(true); }}
        />
      )}

      {/* Phase 2: Cinematic story intro — waits for readyToAdvance after acts */}
      {ritualPhase === "intro" && (
        <CartoonStoryIntro
          childName={routerState.childName ?? ""}
          storyTitle={routerState.storyTitle ?? currentStory.title}
          theme={routerState.theme ?? "adventure"}
          backgroundImage={progressiveImages[0] ?? null}
          duration={18_000}
          readyToAdvance={readyToAdvance}
          onComplete={() => setRitualPhase("player")}
          onSkip={() => { setUserSkipped(true); setRitualPhase("player"); setShowPlayPrompt(true); }}
        />
      )}

      {/* Brief cinematic intro for revisited stories */}
      {showOldIntro && (
        <CinematicIntro
          childName={activeChild?.name ?? ""}
          storyTitle={currentStory.title}
          duration={5000}
          minDuration={0}
          enterFullscreen
          onDone={() => { setShowOldIntro(false); setShowPlayPrompt(true); }}
        />
      )}

      {/* Back nav */}
      <div
        className={`px-4 lg:px-8 py-4 flex items-center justify-between transition-opacity duration-500 ${
          isDimmed ? "opacity-0 pointer-events-none" : ""
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </button>
        <button
          onClick={() => navigate("/create")}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Create New Story
        </button>
      </div>

      <div className="px-4 lg:px-8 pb-10 space-y-4">
        {/* Carousel + overlays */}
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <LargeStoryPlayer
              pages={carouselPages}
              subtitles={narratableText}
              initialIndex={textPage}
              onPageChange={setTextPage}
              storyId={currentStory.id}
              isDimmed={isDimmed}
              onToggleDim={() => setIsDimmed((d) => !d)}
              onSettingsClick={() => setShowSettings((s) => !s)}
              nextPageGuardCount={userSkipped ? 0 : (sceneSlots.length > 0 ? MIN_READY_IMAGES : 0)}
            />
          </div>

          {/* Play prompt — appears for 5 s after intro closes */}
          {showPlayPrompt && hasParagraphs && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl cursor-pointer"
              style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 70%)" }}
              onClick={() => { speakParagraph(narratableText[textPage]); setShowPlayPrompt(false); }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
                <button
                  className="relative w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm shadow-2xl flex items-center justify-center hover:bg-white transition-colors"
                  aria-label="Play narration"
                >
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Voice settings panel */}
          {showSettings && (
            <div
              className="absolute inset-0 z-40 flex items-end rounded-2xl overflow-hidden"
              onClick={() => setShowSettings(false)}
            >
              <div
                className="w-full bg-gray-900/95 backdrop-blur-sm p-5 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">Voice Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-white/50 hover:text-white p-1 transition-colors"
                    aria-label="Close settings"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Narrator</p>
                  <div className="flex flex-wrap gap-2">
                    {VOICE_PROFILES.map((vp) => (
                      <button
                        key={vp.id}
                        onClick={() => handleVoiceChange(vp.id)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                          ttsVoice === vp.id
                            ? "bg-primary text-white"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                        }`}
                      >
                        {vp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Speed</p>
                  <div className="flex gap-2">
                    {([0.8, 1.0, 1.2, 1.5] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                          ttsSpeed === s
                            ? "bg-primary text-white"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                        }`}
                      >
                        {s === 0.8 ? "Slow" : s === 1.0 ? "Normal" : s === 1.2 ? "Fast" : "Faster"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audio controls */}
        {hasParagraphs && (
          <AudioControls
            isPlaying={isTTSPlaying}
            isLoading={isTTSLoading}
            hasVoices={availableVoices.length > 0}
            onPlay={() => speakParagraph(narratableText[textPage])}
            onPause={stopTTS}
            onSpeedChange={handleSpeedChange}
            onVoiceChange={handleVoiceChange}
            progress={ttsProgress}
            currentSpeed={ttsSpeed}
            currentVoice={ttsVoice}
            duration={ttsDuration}
          />
        )}

        {/* Title + meta */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentStory.title}</h1>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{currentStory.summary}</p>
          {knownMock && (
            <div className="flex flex-wrap gap-2">
              <Badge variant={getBadgeVariant(knownMock.status)}>{knownMock.status}</Badge>
              <Badge>{knownMock.category}</Badge>
              <Badge>Ages {knownMock.ageRange}</Badge>
              <Badge>{knownMock.duration}</Badge>
            </div>
          )}
        </div>

        {/* Feedback footer — last page only */}
        {isLastPage && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">How was the story?</h3>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_OPTIONS.map(({ reaction, icon: Icon, label }) => (
                <button
                  key={reaction}
                  onClick={() => handleFeedback(reaction)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    selectedReaction === reaction
                      ? "bg-primary text-white border-primary"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={handleContinueTomorrow}
                disabled={markedContinue}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  markedContinue
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20"
                }`}
              >
                {markedContinue
                  ? <><Check className="w-4 h-4" /> We&apos;ll remember this!</>
                  : <><ArrowRight className="w-4 h-4" /> Continue this story tomorrow</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
