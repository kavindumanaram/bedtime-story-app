import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles, Heart, AlertTriangle, Clock, Rabbit, Mountain, ArrowRight, Check,
} from "lucide-react";
import { Badge } from "../components/Badge";
import LargeStoryPlayer from "../components/LargeStoryPlayer";
import { AudioControls, VOICE_PROFILES } from "../components/AudioControls";
import { stories } from "../data/mock";
import { loadStory } from "../api/storyDb";
import { supabase } from "../lib/supabase";
import { updateStreak } from "../api/dailyStory";
import { updateMemoryAfterRead, saveFeedback } from "../api/storyMemory";
import { useAuth } from "../contexts/AuthContext";
import type { FeedbackReaction } from "../lib/supabase";

const FEEDBACK_OPTIONS: { reaction: FeedbackReaction; icon: React.FC<{ className?: string }>; label: string }[] = [
  { reaction: "loved",          icon: Heart,          label: "Loved it" },
  { reaction: "too_scary",      icon: AlertTriangle,  label: "Too scary" },
  { reaction: "too_long",       icon: Clock,          label: "Too long" },
  { reaction: "more_animals",   icon: Rabbit,         label: "More animals" },
  { reaction: "more_adventure", icon: Mountain,       label: "More adventure" },
];

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeChild, profile } = useAuth();

  const knownMock = stories.find((s) => s.id === id);
  const [currentStory, setCurrentStory] = useState(knownMock ?? stories[0]);
  const [isLoading, setIsLoading] = useState(!knownMock);
  const [textPage, setTextPage] = useState(0);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);

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

  // Load TTS voices — async in Chrome, synchronous in Safari
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
    // onstart clears the loading spinner once the browser actually begins speaking
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

  const paragraphs = currentStory.text ?? [];
  const hasParagraphs = paragraphs.length > 0;
  const isLastPage = hasParagraphs && textPage === paragraphs.length - 1;

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

  // Smart voice matching: keyword search first, index fallback, then first available
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

  const carouselPages = (currentStory as any).images?.length
    ? (currentStory as any).images
    : currentStory.pages?.length
      ? currentStory.pages
      : undefined;

  const ttsDurationSecs = hasParagraphs
    ? Math.max(1, Math.round(paragraphs[textPage].length * 0.065 / ttsSpeed))
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
      {/* Back nav — fades out in Story Mode */}
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
        {/* Carousel — single source of truth for current page via onPageChange */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <LargeStoryPlayer
            pages={carouselPages}
            subtitles={paragraphs}
            initialIndex={textPage}
            onPageChange={setTextPage}
            storyId={currentStory.id}
            isDimmed={isDimmed}
            onToggleDim={() => setIsDimmed((d) => !d)}
          />
        </div>

        {/* Audio controls — directly below carousel, no separate text reader card */}
        {hasParagraphs && (
          <AudioControls
            isPlaying={isTTSPlaying}
            isLoading={isTTSLoading}
            hasVoices={availableVoices.length > 0}
            onPlay={() => speakParagraph(paragraphs[textPage])}
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
                  ? <><Check className="w-4 h-4" /> We'll remember this!</>
                  : <><ArrowRight className="w-4 h-4" /> Continue this story tomorrow</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
