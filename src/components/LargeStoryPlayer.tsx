import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
} from "lucide-react";

type Props = {
  pages?: string[];
  subtitles?: string[];
  initialIndex?: number;
  onToggleDetails?: () => void;
  detailsOpen?: boolean;
  storyId?: string;
};

const TINTS = [
  { name: "warm", class: "sepia-[0.15]" },
  { name: "cool", class: "brightness-[0.95] saturate-[1.1] hue-rotate-[5deg]" },
  { name: "dreamy", class: "blur-[0.5px] brightness-[1.05] contrast-[0.95]" },
];

export default function LargeStoryPlayer({
  pages = [],
  subtitles = [],
  initialIndex = 0,
  onToggleDetails,
  detailsOpen = false,
  storyId,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const getPages = () => {
    if (pages && pages.length) return pages;
    if (storyId) {
      const stored = localStorage.getItem(`story-images-${storyId}`);
      if (stored) {
        try { return JSON.parse(stored); } catch { /* fall through */ }
      }
    }
    return [];
  };

  const DEFAULT_PAGES = [
    "https://images.pexels.com/photos/3662622/pexels-photo-3662622.jpeg",
    "https://images.pexels.com/photos/3747416/pexels-photo-3747416.jpeg",
    "https://images.pexels.com/photos/374054/pexels-photo-374054.jpeg",
  ];

  const loadedPages = getPages();
  const total = Math.max(
    loadedPages.length,
    subtitles?.length || DEFAULT_PAGES.length,
    DEFAULT_PAGES.length,
  );
  const img = (loadedPages.length ? loadedPages : DEFAULT_PAGES)[index % total];
  const subtitle = subtitles[index] || "";
  const tintEffect = TINTS[index % TINTS.length];

  useEffect(() => {
    const onFull = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFull);
    return () => document.removeEventListener("fullscreenchange", onFull);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement)
        await (containerRef.current as any).requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) { /* ignore */ }
  };

  const stopSpeech = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utterRef.current = null;
    setIsPlayingAudio(false);
  };

  const speakCurrent = () => {
    if (!("speechSynthesis" in window)) return;
    stopSpeech();
    const utter = new SpeechSynthesisUtterance(subtitle || "");
    utter.rate = 0.95;
    utter.lang = "en-US";
    utter.onend = () => setIsPlayingAudio(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlayingAudio(true);
  };

  useEffect(() => {
    if (isPlayingAudio) speakCurrent();
    setPageTransition(true);
    const timer = setTimeout(() => setPageTransition(false), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const glassBtn = "w-11 h-11 rounded-full flex items-center justify-center shadow-lg bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-200";
  const glassNav = "absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden bg-black ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: isFullscreen ? "100vh" : "520px", width: isFullscreen ? "100vw" : "100%" }}
      >
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: pageTransition ? 0.6 : 1 }}
        >
          <img
            ref={imgRef}
            src={img}
            alt={`page-${index + 1}`}
            className={`w-full h-full object-cover transition-transform duration-[2s] ease-out ${tintEffect.class}`}
            style={{ filter: "brightness(0.75)", transform: pageTransition ? "scale(1)" : "scale(1.02)" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Crect fill='%23000000' width='1200' height='800'/%3E%3C/svg%3E";
            }}
          />
        </div>

        {/* Subtitle overlay */}
        <div className="absolute left-0 right-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <p className="max-w-2xl mx-auto text-white font-bold text-xl text-center leading-relaxed drop-shadow-lg">
            {subtitle}
          </p>
        </div>

        {/* Top-right controls */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); isPlayingAudio ? stopSpeech() : speakCurrent(); }}
            aria-label={isPlayingAudio ? "Stop audio" : "Play audio"}
            className={glassBtn}
          >
            {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleDetails?.(); }}
            aria-label={detailsOpen ? "Hide details" : "Show details"}
            className={`${glassBtn} ${detailsOpen ? "bg-white/40" : ""}`}
          >
            <BookOpen className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className={glassBtn}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Left nav */}
        <button
          onClick={() => { stopSpeech(); setIndex((i) => Math.max(0, i - 1)); }}
          disabled={index === 0}
          className={`${glassNav} left-3`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Right nav */}
        <button
          onClick={() => { stopSpeech(); setIndex((i) => Math.min(total - 1, i + 1)); }}
          disabled={index === total - 1}
          className={`${glassNav} right-3`}
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-3 text-center text-sm text-gray-600">
        Page {index + 1} of {total}
      </div>
    </div>
  );
}
