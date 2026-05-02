import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Volume2, VolumeX, ChevronLeft, ChevronRight,
  Sparkles, Heart, AlertTriangle, Clock, Rabbit, Mountain, ArrowRight, Check,
} from "lucide-react";
import { Badge } from "../components/Badge";
import LargeStoryPlayer from "../components/LargeStoryPlayer";
import { stories } from "../data/mock";
import { loadStory } from "../api/storyDb";
import { supabase } from "../lib/supabase";
import { updateStreak } from "../api/dailyStory";
import { updateMemoryAfterRead, saveFeedback } from "../api/storyMemory";
import { useAuth } from "../contexts/AuthContext";
import type { FeedbackReaction } from "../lib/supabase";

const FEEDBACK_OPTIONS: { reaction: FeedbackReaction; icon: React.FC<{ className?: string }>; label: string }[] = [
  { reaction: "loved",         icon: Heart,         label: "Loved it" },
  { reaction: "too_scary",     icon: AlertTriangle,  label: "Too scary" },
  { reaction: "too_long",      icon: Clock,          label: "Too long" },
  { reaction: "more_animals",  icon: Rabbit,         label: "More animals" },
  { reaction: "more_adventure",icon: Mountain,       label: "More adventure" },
];

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeChild, profile } = useAuth();

  // If the id matches a local mock story we already have the data — no network needed.
  const knownMock = stories.find((s) => s.id === id);
  const [currentStory, setCurrentStory] = useState(knownMock ?? stories[0]);
  // Only show a loading skeleton for non-mock ids (Supabase UUIDs or db.json timestamp ids)
  const [isLoading, setIsLoading] = useState(!knownMock);
  const [textPage, setTextPage] = useState(0);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);

  // Feedback state
  const [selectedReaction, setSelectedReaction] = useState<FeedbackReaction | null>(null);
  const [markedContinue, setMarkedContinue] = useState(false);
  const [streakUpdated, setStreakUpdated] = useState(false);

  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }

    loadStory(id).then(async (saved) => {
      if (saved) {
        setCurrentStory({ ...stories[0], ...saved, pages: saved.images ?? [saved.coverImage] });
        setIsLoading(false);
        return;
      }

      if (knownMock) {
        // Already showing the correct mock story — nothing more to fetch
        setIsLoading(false);
        return;
      }

      // Story was saved to Supabase by triggerRead / triggerContinuation
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

  const stopTTS = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    ttsRef.current = null;
    setIsTTSPlaying(false);
  };

  const speakParagraph = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    stopTTS();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.lang = "en-US";
    utter.onend = () => setIsTTSPlaying(false);
    ttsRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsTTSPlaying(true);
  };

  useEffect(() => { stopTTS(); }, [textPage]);
  useEffect(() => { return () => stopTTS(); }, []);

  const paragraphs = currentStory.text ?? [];
  const hasParagraphs = paragraphs.length > 0;
  const isLastPage = hasParagraphs && textPage === paragraphs.length - 1;

  // When reaching the last page, update streak (once per session)
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
          {/* Image skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="aspect-[4/3] sm:aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-gray-300 animate-spin [animation-duration:3s]" />
            </div>
          </div>
          {/* Title skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <div className="h-7 bg-gray-200 animate-pulse rounded-lg w-2/3" />
            <div className="h-4 bg-gray-100 animate-pulse rounded-lg w-full" />
            <div className="h-4 bg-gray-100 animate-pulse rounded-lg w-4/5" />
            <div className="flex gap-2 pt-1">
              {[40, 56, 64, 48].map((w) => (
                <div key={w} className="h-6 bg-gray-100 animate-pulse rounded-full" style={{ width: w }} />
              ))}
            </div>
          </div>
          {/* Text skeleton */}
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
    <div className="min-h-screen bg-gray-50">
      {/* Back nav */}
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
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
        {/* Carousel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <LargeStoryPlayer
            pages={carouselPages}
            subtitles={paragraphs}
            initialIndex={textPage}
            storyId={currentStory.id}
          />
        </div>

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

        {/* Text reader */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Story Text</h2>
            {hasParagraphs && (
              <span className="text-xs text-gray-400">
                Page {textPage + 1} of {paragraphs.length}
              </span>
            )}
          </div>

          {hasParagraphs && (
            <div className="flex items-center gap-2">
              {paragraphs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTextPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`rounded-full transition-all duration-200 ${
                    i === textPage
                      ? "w-6 h-2 bg-primary"
                      : "w-2 h-2 bg-gray-200 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}

          <p className="text-gray-700 text-base leading-relaxed min-h-[100px]">
            {hasParagraphs ? paragraphs[textPage] : "Create a story to start reading here."}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <button
              onClick={() => {
                if (isTTSPlaying) stopTTS();
                else if (hasParagraphs) speakParagraph(paragraphs[textPage]);
              }}
              disabled={!hasParagraphs}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isTTSPlaying
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
              }`}
            >
              {isTTSPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isTTSPlaying ? "Stop" : "Read Aloud"}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setTextPage((p) => Math.max(0, p - 1))}
                disabled={!hasParagraphs || textPage === 0}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors"
                aria-label="Previous paragraph"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setTextPage((p) => Math.min(paragraphs.length - 1, p + 1))}
                disabled={!hasParagraphs || textPage === paragraphs.length - 1}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors"
                aria-label="Next paragraph"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback footer — shown on last page */}
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

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
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
