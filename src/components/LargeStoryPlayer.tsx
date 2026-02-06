import { useEffect, useRef, useState } from "react";

type Props = {
  pages?: string[];
  subtitles?: string[];
  initialIndex?: number;
  onToggleDetails?: () => void;
  detailsOpen?: boolean;
  storyId?: string;
};

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load generated images from localStorage if storyId provided
  const getPages = () => {
    if (pages && pages.length) {
      return pages;
    }
    if (storyId) {
      const storageKey = `story-images-${storyId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Fall through to default
        }
      }
    }
    return [];
  };

  // Friendly, child-oriented images (Pexels placeholders)
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
    } catch (_) {
      /* ignore */
    }
  };

  const stopSpeech = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utterRef.current = null;
    setIsPlayingAudio(false);
  };

  const speakCurrent = () => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis not supported in this browser.");
      return;
    }
    stopSpeech();
    const utter = new SpeechSynthesisUtterance(subtitle || "");
    utter.rate = 0.95;
    utter.lang = "en-US";
    utter.onend = () => {
      setIsPlayingAudio(false);
    };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlayingAudio(true);
  };

  useEffect(() => {
    if (isPlayingAudio) speakCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden bg-black ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      }`}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: isFullscreen ? "100vh" : "520px",
          width: isFullscreen ? "100vw" : "100%",
        }}
      >
        <img
          src={img}
          alt={`page-${index + 1}`}
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.75)" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Crect fill='%23000000' width='1200' height='800'/%3E%3C/svg%3E";
          }}
        />

        <div className="absolute left-0 right-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <div className="text-white font-extrabold text-2xl text-center leading-relaxed">
            {subtitle}
          </div>
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isPlayingAudio) stopSpeech();
              else speakCurrent();
            }}
            aria-label={isPlayingAudio ? "Stop audio" : "Play audio"}
            title={isPlayingAudio ? "Stop audio" : "Play audio"}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-2xl font-bold ${isPlayingAudio ? "bg-red-600 text-white" : "bg-white text-red-600"}`}
          >
            {isPlayingAudio ? "⏸" : "▶"}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDetails && onToggleDetails();
            }}
            aria-label="Toggle details"
            title={detailsOpen ? "Hide details" : "Show details"}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-2xl font-bold ${detailsOpen ? "bg-blue-600 text-white" : "bg-white text-blue-600"}`}
          >
            ℹ️
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-2xl bg-white text-green-600"
          >
            ⛶
          </button>
        </div>

        <button
          onClick={() => {
            stopSpeech();
            setIndex((i) => Math.max(0, i - 1));
          }}
          disabled={index === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-lg bg-white/90 flex items-center justify-center text-xl shadow"
        >
          ◀
        </button>

        <button
          onClick={() => {
            stopSpeech();
            setIndex((i) => Math.min(total - 1, i + 1));
          }}
          disabled={index === total - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-lg bg-white/90 flex items-center justify-center text-xl shadow"
        >
          ▶
        </button>
      </div>

      <div className="mt-3 text-center text-sm text-gray-600">
        Page {index + 1} of {total}
      </div>
    </div>
  );
}
