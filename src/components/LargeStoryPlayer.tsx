import React, { useEffect, useRef, useState } from "react";

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

  const DEFAULT_PAGES = [
    "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg",
    "https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg",
    "https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg",
  ];

  const total = Math.max(
    pages.length || 0,
    subtitles.length || DEFAULT_PAGES.length,
    DEFAULT_PAGES.length,
  );
  const img = pages[index] || DEFAULT_PAGES[index % DEFAULT_PAGES.length];
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
    } catch (e) {
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
        if (next === i) {
          stopAuto();
        }
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
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden bg-black"
    >
      <div className="relative w-full" style={{ height: "520px" }}>
        <img
          src={img}
          alt={`page-${index + 1}`}
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.75)" }}
        />

        {/* subtitle bar */}
        <div className="absolute left-0 right-0 bottom-0 p-5 bg-gradient-to-t from-black/70 to-transparent">
          <div className="text-white font-extrabold text-2xl text-center">
            {subtitle}
          </div>
        </div>

        {/* small icons top-right */}
        <div className="absolute top-3 right-3 flex gap-2">
          {/* Details toggle button (shows story text / customization) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isPlayingAudio) stopSpeech();
              else speakCurrent();
            }}
            aria-label={isPlayingAudio ? "Stop audio" : "Play audio"}
            title={isPlayingAudio ? "Stop audio" : "Play audio"}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${isPlayingAudio ? "bg-red-600 text-white" : "bg-white"}`}
          >
            {isPlayingAudio ? (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <rect x="6" y="5" width="4" height="14" fill="#fff" />
                <rect x="14" y="5" width="4" height="14" fill="#fff" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M5 3L19 12L5 21V3Z" fill="#1976d2" />
              </svg>
            )}
          </button>

          {/* Details toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDetails && onToggleDetails();
            }}
            aria-label="Toggle details"
            title={detailsOpen ? "Hide details" : "Show details"}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${detailsOpen ? "bg-blue-600 text-white" : "bg-white"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zM3 5h2V3H3v2zm4 12h14v-2H7v2zM7 9h14V7H7v2zm0-6v2h14V3H7z"
                fill="#1976d2"
              />
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
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${isAutoReading ? "bg-orange-500 text-white" : "bg-white"}`}
          >
            {isAutoReading ? (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M7 7L17 12L7 17V7Z" fill="#fff" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12H4c0-4.42 3.58-8 8-8V2z"
                  fill="#388e3c"
                />
                <path
                  d="M12 22c5.52 0 10-4.48 10-10h-2c0 4.42-3.58 8-8 8v2z"
                  fill="#388e3c"
                />
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
            className="w-10 h-10 rounded-full flex items-center justify-center shadow bg-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M3 3H9V5H5V9H3V3ZM21 3V9H19V5H15V3H21ZM3 15H5V19H9V21H3V15ZM15 21H21V15H19V19H15V21Z"
                fill="#1976d2"
              />
            </svg>
          </button>
        </div>

        {/* side prev/next */}
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
