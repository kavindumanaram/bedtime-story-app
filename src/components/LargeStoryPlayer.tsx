import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  Moon,
  Music,
} from "lucide-react";
import { useAmbientAudio } from "../hooks/useAmbientAudio";

type Props = {
  pages?: string[];
  subtitles?: string[];
  initialIndex?: number;
  onPageChange?: (index: number) => void;
  onToggleDetails?: () => void;
  detailsOpen?: boolean;
  storyId?: string;
  isDimmed?: boolean;
  onToggleDim?: () => void;
};

const TINTS = [
  { name: "warm", class: "sepia-[0.15]" },
  { name: "cool", class: "brightness-[0.95] saturate-[1.1] hue-rotate-[5deg]" },
  { name: "dreamy", class: "blur-[0.5px] brightness-[1.05] contrast-[0.95]" },
];

const DEFAULT_PAGES = [
  "https://images.pexels.com/photos/3662622/pexels-photo-3662622.jpeg",
  "https://images.pexels.com/photos/3747416/pexels-photo-3747416.jpeg",
  "https://images.pexels.com/photos/374054/pexels-photo-374054.jpeg",
];

export default function LargeStoryPlayer({
  pages = [],
  subtitles = [],
  initialIndex = 0,
  onPageChange,
  onToggleDetails,
  detailsOpen = false,
  storyId,
  isDimmed = false,
  onToggleDim,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambientAudio = useAmbientAudio();

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2500);
  };

  const getLoadedPages = () => {
    if (pages && pages.length) return pages;
    if (storyId) {
      const stored = localStorage.getItem(`story-images-${storyId}`);
      if (stored) {
        try { return JSON.parse(stored) as string[]; } catch { /* fall through */ }
      }
    }
    return [];
  };

  const loadedPages = getLoadedPages();
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

  useEffect(() => {
    setPageTransition(true);
    const timer = setTimeout(() => setPageTransition(false), 300);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement)
        await (containerRef.current as HTMLElement).requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) { /* ignore */ }
  };

  const goTo = (newIndex: number) => {
    setIndex(newIndex);
    onPageChange?.(newIndex);
  };

  const glassBtn =
    "w-11 h-11 rounded-full flex items-center justify-center shadow-lg bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-200";
  const glassNav =
    "absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden bg-black ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: isFullscreen ? "100vh" : "520px", width: isFullscreen ? "100vw" : "100%" }}
      >
        {/* Dim overlay — always in DOM, opacity transitions smoothly */}
        <div
          className="absolute inset-0 bg-black pointer-events-none z-10 transition-opacity duration-700"
          style={{ opacity: isDimmed ? 0.72 : 0 }}
        />

        {/* Image with page-turn transform */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            opacity: pageTransition ? 0.4 : 1,
            transform: pageTransition ? "scale(0.97) translateX(-6px)" : "translateX(0)",
          }}
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

        {/* Subtitle */}
        <div className="absolute left-0 right-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-20">
          <p className="max-w-2xl mx-auto text-white font-bold text-xl text-center leading-relaxed drop-shadow-lg">
            {subtitle}
          </p>
        </div>

        {/* Toast notification */}
        <div
          className={`absolute bottom-24 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
            toastMsg ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="px-4 py-2 bg-black/75 text-white text-sm rounded-full backdrop-blur-sm whitespace-nowrap">
            {toastMsg ?? " "}
          </div>
        </div>

        {/* Top-right controls — fade out when dimmed, reveal on hover */}
        <div
          className={`absolute top-3 right-3 flex gap-2 z-30 transition-opacity duration-500 ${
            isDimmed ? "opacity-0 hover:opacity-100" : ""
          }`}
        >
          {/* Ambient music — green tint + ring when active */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextState = !ambientAudio.isPlaying;
              ambientAudio.toggle();
              showToast(nextState ? "🎵 Calm music on" : "🔇 Music off");
            }}
            aria-label={ambientAudio.isPlaying ? "Stop ambient music" : "Play ambient music"}
            className={`${glassBtn} ${
              ambientAudio.isPlaying
                ? "ring-2 ring-emerald-400/70 text-emerald-300 bg-white/30"
                : ""
            }`}
          >
            <Music className="w-5 h-5" />
          </button>

          {/* Dim lights — amber tint when active */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleDim?.(); }}
            aria-label={isDimmed ? "Bright mode" : "Dim lights"}
            className={`${glassBtn} ${
              isDimmed ? "bg-white/40 text-amber-300 ring-2 ring-amber-300/50" : ""
            }`}
          >
            <Moon className="w-5 h-5" />
          </button>

          {/* Details */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleDetails?.(); }}
            aria-label={detailsOpen ? "Hide details" : "Show details"}
            className={`${glassBtn} ${detailsOpen ? "bg-white/40 ring-2 ring-white/50" : ""}`}
          >
            <BookOpen className="w-5 h-5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className={`${glassBtn} ${isFullscreen ? "bg-white/40 ring-2 ring-white/50" : ""}`}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Left nav */}
        <button
          onClick={() => goTo(Math.max(0, index - 1))}
          disabled={index === 0}
          className={`${glassNav} left-3 z-30`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Right nav */}
        <button
          onClick={() => goTo(Math.min(total - 1, index + 1))}
          disabled={index === total - 1}
          className={`${glassNav} right-3 z-30`}
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Page counter — fades out in dim mode */}
      <div
        className={`mt-3 text-center text-sm text-gray-600 transition-opacity duration-500 ${
          isDimmed ? "opacity-0 pointer-events-none" : ""
        }`}
      >
        Page {index + 1} of {total}
      </div>
    </div>
  );
}
