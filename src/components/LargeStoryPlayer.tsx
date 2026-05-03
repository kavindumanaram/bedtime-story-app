import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  Moon,
  Music,
  Settings,
} from "lucide-react";
import { useAmbientAudio } from "../hooks/useAmbientAudio";

type Props = {
  pages?: (string | null)[];
  subtitles?: string[];
  initialIndex?: number;
  onPageChange?: (index: number) => void;
  onToggleDetails?: () => void;
  detailsOpen?: boolean;
  storyId?: string;
  isDimmed?: boolean;
  onToggleDim?: () => void;
  onSettingsClick?: () => void;
  /**
   * For the first N pages, the Next button is disabled while the next page's
   * image is still null (still generating). Pages ≥ N allow free navigation.
   * Pass 0 (default) to disable the guard entirely.
   */
  nextPageGuardCount?: number;
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

type Sparkle = { id: number; x: number; y: number };

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
  onSettingsClick,
  nextPageGuardCount = 0,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [textKey, setTextKey] = useState(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastParallaxTime = useRef(0);
  const ambientAudio = useAmbientAudio();

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2500);
  };

  const getLoadedPages = (): (string | null)[] => {
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
  const usingDefaults = loadedPages.length === 0;
  const pageSource: (string | null)[] = usingDefaults ? DEFAULT_PAGES : loadedPages;
  const total = Math.max(pageSource.length, subtitles?.length || 1);

  const currentEntry = pageSource[index % pageSource.length] ?? null;
  const isShimmering = !usingDefaults && currentEntry === null;
  const img: string = isShimmering ? "" : (currentEntry as string) ?? "";

  const subtitle = subtitles[index] ?? "";
  const tintEffect = TINTS[index % TINTS.length];

  // Fullscreen listener — only true when THIS container is the fullscreen element
  useEffect(() => {
    const onFull = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFull);
    return () => document.removeEventListener("fullscreenchange", onFull);
  }, []);

  // Page transition trigger
  useEffect(() => {
    setPageTransition(true);
    const timer = setTimeout(() => setPageTransition(false), 300);
    return () => clearTimeout(timer);
  }, [index]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Parallax — direct DOM mutation avoids React re-renders on every mousemove
  const applyParallax = (x: number, y: number) => {
    if (parallaxRef.current) {
      parallaxRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastParallaxTime.current < 16) return;
      lastParallaxTime.current = now;
      const r = el.getBoundingClientRect();
      applyParallax(
        ((e.clientX - r.left - r.width / 2) / r.width) * -12,
        ((e.clientY - r.top - r.height / 2) / r.height) * -8,
      );
    };
    const onLeave = () => applyParallax(0, 0);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const oe = e as DeviceOrientationEvent;
      applyParallax(
        Math.max(-12, Math.min(12, ((oe.gamma ?? 0) / 45) * -10)),
        Math.max(-8, Math.min(8, ((oe.beta ?? 0) / 45) * -6)),
      );
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  // Preload next image
  useEffect(() => {
    const next = pageSource[(index + 1) % pageSource.length];
    if (typeof next === "string" && next) {
      new Image().src = next;
    }
  }, [index, pageSource]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement)
        await (containerRef.current as HTMLElement).requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) { /* ignore */ }
  };

  const goTo = (newIndex: number) => {
    setDirection(newIndex > index ? "right" : "left");
    setIndex(newIndex);
    setTextKey((k) => k + 1);
    onPageChange?.(newIndex);
  };

  const handleImageTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const id = Date.now();
    setSparkles((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setSparkles((prev) => prev.filter((s) => s.id !== id)), 700);
  };

  const slideX = pageTransition ? (direction === "right" ? "-6px" : "6px") : "0px";

  const glassBtn =
    "w-11 h-11 rounded-full flex items-center justify-center shadow-lg bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-200";
  const glassNav =
    "absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sparkleFly {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0); }
        }
        @keyframes kenBurns {
          0%   { transform: scale(1.02) translate(0%,    0%);    }
          25%  { transform: scale(1.05) translate(-0.4%, -0.2%); }
          50%  { transform: scale(1.03) translate( 0.3%,  0.2%); }
          75%  { transform: scale(1.06) translate(-0.2%,  0.3%); }
          100% { transform: scale(1.02) translate(0%,    0%);    }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`w-full rounded-lg overflow-hidden bg-black ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{ height: isFullscreen ? "100vh" : "520px", width: isFullscreen ? "100vw" : "100%" }}
          onClick={handleImageTap}
        >
          {/* Dim overlay */}
          <div
            className="absolute inset-0 bg-black pointer-events-none z-10 transition-opacity duration-700"
            style={{ opacity: isDimmed ? 0.72 : 0 }}
          />

          {/* Image or shimmer with direction-aware transition */}
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              opacity: pageTransition ? 0.4 : 1,
              transform: `scale(${pageTransition ? 0.97 : 1}) translateX(${slideX})`,
            }}
          >
            {/* Mouse-parallax translate wrapper — DOM-mutated directly so no React re-render on mousemove */}
            <div
              ref={parallaxRef}
              className="absolute inset-0"
              style={{ transition: "transform 0.15s linear" }}
            >
              {isShimmering ? (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 animate-pulse flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white/80 animate-spin" />
                </div>
              ) : (
                <img
                  key={index}
                  ref={imgRef}
                  src={img}
                  alt={`page-${index + 1}`}
                  className={`w-full h-full object-cover ${tintEffect.class}`}
                  style={{
                    filter: "brightness(0.75)",
                    animation: "kenBurns 12s ease-in-out infinite",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Crect fill='%23000000' width='1200' height='800'/%3E%3C/svg%3E";
                  }}
                />
              )}
            </div>
          </div>

          {/* Sparkle tap effects */}
          {sparkles.map((s) =>
            [0, 72, 144, 216, 288].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <div
                  key={`${s.id}-${deg}`}
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    left: s.x + Math.round(Math.cos(rad) * 20) - 3,
                    top: s.y + Math.round(Math.sin(rad) * 20) - 3,
                    width: 6,
                    height: 6,
                    backgroundColor: "#fde047",
                    animation: "sparkleFly 0.7s ease-out forwards",
                    zIndex: 25,
                  }}
                />
              );
            })
          )}

          {/* Subtitle */}
          <div className="absolute left-0 right-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-20">
            <p
              key={textKey}
              className="max-w-2xl mx-auto text-white font-bold text-xl text-center leading-relaxed drop-shadow-lg"
              style={{ animation: "fadeSlideUp 0.4s ease-out both" }}
            >
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
              {toastMsg ?? " "}
            </div>
          </div>

          {/* Top-right controls */}
          <div
            className={`absolute top-3 right-3 flex gap-2 z-30 transition-opacity duration-500 ${
              isDimmed ? "opacity-0 hover:opacity-100" : ""
            }`}
          >
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

            <button
              onClick={(e) => { e.stopPropagation(); onToggleDim?.(); }}
              aria-label={isDimmed ? "Bright mode" : "Dim lights"}
              className={`${glassBtn} ${
                isDimmed ? "bg-white/40 text-amber-300 ring-2 ring-amber-300/50" : ""
              }`}
            >
              <Moon className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onToggleDetails?.(); }}
              aria-label={detailsOpen ? "Hide details" : "Show details"}
              className={`${glassBtn} ${detailsOpen ? "bg-white/40 ring-2 ring-white/50" : ""}`}
            >
              <BookOpen className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onSettingsClick?.(); }}
              aria-label="Voice settings"
              className={glassBtn}
            >
              <Settings className="w-5 h-5" />
            </button>

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
            onClick={(e) => { e.stopPropagation(); goTo(Math.max(0, index - 1)); }}
            disabled={index === 0}
            className={`${glassNav} left-3 z-30`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right nav */}
          <button
            onClick={(e) => { e.stopPropagation(); goTo(Math.min(total - 1, index + 1)); }}
            disabled={
              index === total - 1 ||
              (nextPageGuardCount > 0 &&
                index < nextPageGuardCount &&
                pageSource[index + 1] === null)
            }
            className={`${glassNav} right-3 z-30`}
            aria-label="Next page"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Page counter */}
        <div
          className={`mt-3 text-center text-sm text-gray-600 transition-opacity duration-500 ${
            isDimmed ? "opacity-0 pointer-events-none" : ""
          }`}
        >
          Page {index + 1} of {total}
        </div>
      </div>
    </>
  );
}
