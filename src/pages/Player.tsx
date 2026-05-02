import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "../components/Badge";
import LargeStoryPlayer from "../components/LargeStoryPlayer";
import { stories } from "../data/mock";
import { loadStory } from "../api/storyDb";

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mockStory = stories.find((s) => s.id === id) || stories[0];

  const [currentStory, setCurrentStory] = useState(mockStory);
  const [textPage, setTextPage] = useState(0);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);

  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    loadStory(id!).then((saved) => {
      if (saved) {
        setCurrentStory({ ...mockStory, ...saved, pages: saved.images ?? [saved.coverImage] });
      }
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

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "NEW": return "new" as const;
      case "POPULAR": return "popular" as const;
      case "DOWNLOADED": return "downloaded" as const;
      default: return "default" as const;
    }
  };

  const paragraphs = currentStory.text ?? [];
  const hasParagraphs = paragraphs.length > 0;

  // Use images[] when available (future 4-image support), else pages[], else let LargeStoryPlayer use defaults
  const carouselPages = (currentStory as any).images?.length
    ? (currentStory as any).images
    : currentStory.pages?.length
      ? currentStory.pages
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Back nav + Create button ───────────────────────── */}
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

        {/* ── Carousel card ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <LargeStoryPlayer
            pages={carouselPages}
            subtitles={paragraphs}
            initialIndex={textPage}
            storyId={currentStory.id}
          />
        </div>

        {/* ── Title + meta card ──────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentStory.title}</h1>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{currentStory.summary}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={getBadgeVariant(mockStory.status)}>{mockStory.status}</Badge>
            <Badge>{mockStory.category}</Badge>
            <Badge>Ages {mockStory.ageRange}</Badge>
            <Badge>{mockStory.duration}</Badge>
          </div>
        </div>

        {/* ── Text reader card ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Story Text</h2>
            {hasParagraphs && (
              <span className="text-xs text-gray-400">
                Page {textPage + 1} of {paragraphs.length}
              </span>
            )}
          </div>

          {/* Dot indicators */}
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

          {/* Paragraph */}
          <p className="text-gray-700 text-base leading-relaxed min-h-[100px]">
            {hasParagraphs
              ? paragraphs[textPage]
              : "Create a story to start reading here."}
          </p>

          {/* Controls */}
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
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous paragraph"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setTextPage((p) => Math.min(paragraphs.length - 1, p + 1))}
                disabled={!hasParagraphs || textPage === paragraphs.length - 1}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next paragraph"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
