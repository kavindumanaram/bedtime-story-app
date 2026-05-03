import React, { useState, useEffect } from "react";

const MESSAGES = [
  "✨ Once upon a time...",
  "🌙 Creating your characters...",
  "⭐ Writing the adventure...",
  "🌟 Adding magical details...",
  "🦋 Your story is almost ready...",
  "🌈 Painting the tale with words...",
];

type StarDef = { top: string; left: string; size: number; delay: number };
const STARS: StarDef[] = [
  { top: "12%", left: "8%",  size: 1.0, delay: 0   },
  { top: "20%", left: "88%", size: 0.8, delay: 0.6 },
  { top: "65%", left: "5%",  size: 1.2, delay: 1.0 },
  { top: "75%", left: "92%", size: 0.9, delay: 0.3 },
  { top: "40%", left: "95%", size: 1.1, delay: 1.4 },
  { top: "85%", left: "15%", size: 0.8, delay: 0.8 },
  { top: "30%", left: "3%",  size: 1.0, delay: 1.7 },
  { top: "55%", left: "97%", size: 0.7, delay: 0.2 },
];

interface Props {
  phase: "writing" | "painting";
  coverImage: string | null;
  childName?: string;
}

export const GenerationProgress: React.FC<Props> = ({ phase, coverImage, childName }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    setMessageIndex(0);
    setProgress(5);

    const msgInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 2500);

    const progInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 1.2, 88));
    }, 400);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
    };
  }, [phase]);

  if (phase === "painting" && coverImage !== null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        <img src={coverImage} alt="Story cover" className="w-48 h-48 rounded-2xl object-cover shadow-lg" />
        <p className="text-sm text-gray-500">Finalising your story...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes twinkleGen {
          0%, 100% { opacity: 0.15; transform: scale(0.75); }
          50%       { opacity: 0.9;  transform: scale(1.3);  }
        }
        @keyframes floatMsgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes wandSway {
          0%, 100% { transform: rotate(-12deg) scale(1);    }
          50%       { transform: rotate(12deg)  scale(1.08); }
        }
        @keyframes ringPing {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0;   }
        }
      `}</style>

      <div className="relative flex flex-col items-center justify-center py-12 gap-6 w-full overflow-hidden">
        {/* Decorative star field */}
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute pointer-events-none text-amber-400 select-none"
            style={{
              top: s.top,
              left: s.left,
              fontSize: `${s.size * 1.1}rem`,
              animation: `twinkleGen ${2 + i * 0.3}s ease-in-out ${s.delay}s infinite`,
            }}
          >
            ✦
          </span>
        ))}

        {/* Wand pulse */}
        <div className="relative flex items-center justify-center w-28 h-28">
          <div
            className="absolute inset-0 rounded-full bg-primary/25"
            style={{ animation: "ringPing 1.8s ease-out infinite" }}
          />
          <div
            className="absolute inset-3 rounded-full bg-amber-200/30"
            style={{ animation: "ringPing 1.8s ease-out 0.6s infinite" }}
          />
          <span
            className="relative z-10 text-5xl select-none"
            style={{ animation: "wandSway 2.8s ease-in-out infinite" }}
          >
            🪄
          </span>
        </div>

        {/* Messages */}
        <div className="text-center space-y-1.5">
          {childName && (
            <p className="text-sm text-gray-400">
              Creating a story for{" "}
              <span className="text-primary font-semibold">{childName}</span>
            </p>
          )}
          <p
            key={messageIndex}
            className="text-lg font-semibold text-gray-800"
            style={{ animation: "floatMsgIn 0.5s ease-out both" }}
          >
            {MESSAGES[messageIndex]}
          </p>
          <p className="text-xs text-gray-400">Usually 8–15 seconds</p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs space-y-1.5">
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-400 to-amber-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-0.5">
            <span>Writing your story…</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </>
  );
};
