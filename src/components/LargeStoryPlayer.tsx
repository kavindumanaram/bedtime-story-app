import { useEffect, useRef, useState } from "react";

type Props = {
  pages?: string[];
  subtitles?: string[];
  autoAdvanceMs?: number;
  initialIndex?: number;
  onToggleDetails?: () => void;
  detailsOpen?: boolean;
};

export default function LargeStoryPlayer({
  pages = [],
  subtitles = [],
  autoAdvanceMs = 4500,
  initialIndex = 0,
  onToggleDetails,
  detailsOpen = false,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAutoReading, setIsAutoReading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Friendly, child-oriented images (Pexels placeholders)
  const DEFAULT_PAGES = [
    "https://images.pexels.com/photos/3662622/pexels-photo-3662622.jpeg",
    "https://images.pexels.com/photos/3747416/pexels-photo-3747416.jpeg",
    "https://images.pexels.com/photos/374054/pexels-photo-374054.jpeg",
  ];

  const total = Math.max(pages?.length || 0, subtitles?.length || DEFAULT_PAGES.length, DEFAULT_PAGES.length);
  const img = (pages && pages.length ? pages : DEFAULT_PAGES)[index % total];
  const subtitle = subtitles[index] || "";

  useEffect(() => {
    const onFull = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFull);
    return () => document.removeEventListener("fullscreenchange", onFull);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) await (containerRef.current as any).requestFullscreen();
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
      if (isAutoReading && index < total - 1) setIndex((i) => i + 1);
    };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlayingAudio(true);
  };

  const startAuto = () => {
    if (intervalRef.current) return;
    setIsAutoReading(true);
    intervalRef.current = window.setInterval(() => {
      setIndex((i) => {
        const next = Math.min(total - 1, i + 1);
        if (next === i) stopAuto();
        return next;
      });
    }, autoAdvanceMs) as unknown as number;
  };

  const stopAuto = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoReading(false);
  };

  useEffect(() => {
    if (isPlayingAudio) speakCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    return () => {
      stopSpeech();
      stopAuto();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden bg-black">
      <div className="relative w-full" style={{ height: "520px" }}>
        <img src={img} alt={`page-${index + 1}`} className="w-full h-full object-cover" style={{ filter: "brightness(0.75)" }} />

        <div className="absolute left-0 right-0 bottom-0 p-5 bg-gradient-to-t from-black/70 to-transparent">
          <div className="text-white font-extrabold text-2xl text-center">{subtitle}</div>
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
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${isPlayingAudio ? "bg-red-600 text-white" : "bg-white"}`}>
            {isPlayingAudio ? (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <g fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="5" width="4" height="14" rx="1" fill="#fff" />
                  <rect x="14" y="5" width="4" height="14" rx="1" fill="#fff" />
                </g>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path d="M5 4.5L19 12L5 19.5V4.5Z" fill="#ff6b6b" />
              </svg>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDetails && onToggleDetails();
            }}
            aria-label="Toggle details"
            title={detailsOpen ? "Hide details" : "Show details"}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${detailsOpen ? "bg-blue-600 text-white" : "bg-white"}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="7" r="2.2" fill="#FFD166" />
              <rect x="4" y="11" width="16" height="2.6" rx="1" fill="#06D6A0" />
              <rect x="4" y="15" width="10" height="2.6" rx="1" fill="#118AB2" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAutoReading) stopAuto();
              else startAuto();
            }}
            aria-label={isAutoReading ? "Stop reading" : "Start reading"}
            title={isAutoReading ? "Stop reading" : "Start reading"}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${isAutoReading ? "bg-orange-500 text-white" : "bg-white"}`}>
            {isAutoReading ? (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path d="M7 7L17 12L7 17V7Z" fill="#ffffff" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path d="M3 5c0 6.627 5.373 12 12 12v-2c-5.523 0-10-4.477-10-10H3z" fill="#ffd54f" />
                <path d="M21 12c0 1.1-.9 2-2 2v-4c1.1 0 2 .9 2 2z" fill="#ffb4a2" />
              </svg>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow bg-white">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path d="M4 4h6v2H6v4H4V4z" fill="#06D6A0" />
              <path d="M20 20h-6v-2h4v-4h2v6z" fill="#118AB2" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => {
            stopSpeech();
            setIndex((i) => Math.max(0, i - 1));
          }}
          disabled={index === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-lg bg-white/90 flex items-center justify-center text-xl shadow">
          ◀
        </button>

        <button
          onClick={() => {
            stopSpeech();
            setIndex((i) => Math.min(total - 1, i + 1));
          }}
          disabled={index === total - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-lg bg-white/90 flex items-center justify-center text-xl shadow">
          ▶
        </button>
      </div>

      <div className="mt-3 text-center text-sm text-gray-600">Page {index + 1} of {total}</div>
    </div>
  );
}
