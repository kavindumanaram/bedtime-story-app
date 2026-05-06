import React, { useState, useEffect, useRef } from "react";

interface Props {
  childName: string;
  storyTitle: string;
  theme: string;
  mainCharacter?: string;
  backgroundImage?: string | null;
  onComplete: () => void;
  onSkip: () => void;
  /** Total duration of the 4 acts (ms). Default 18 000. */
  duration?: number;
  /** When true AND all 4 acts have played, auto-completes. Default: always complete after acts. */
  readyToAdvance?: boolean;
}

// Act timing (ms from mount)
const ACT_1_END  =  4_000;  // "Tonight's story for…"
const ACT_2_END  = 10_000;  // Big title card
const ACT_3_END  = 14_000;  // "A magical bedtime adventure"
const ACT_4_END  = 18_000;  // "Let's begin!"

/** Act 5 = waiting state: acts complete but readyToAdvance not yet true */
type Act = 1 | 2 | 3 | 4 | 5;

type StarDef = { top: string; left?: string; right?: string; size: number; delay: number };
const STARS: StarDef[] = [
  { top: "5%",  left: "8%",   size: 1.2, delay: 0    },
  { top: "10%", left: "24%",  size: 2.0, delay: 0.5  },
  { top: "8%",  right: "14%", size: 1.4, delay: 0.9  },
  { top: "14%", right: "6%",  size: 2.6, delay: 0.3  },
  { top: "20%", left: "44%",  size: 0.9, delay: 1.2  },
  { top: "25%", left: "10%",  size: 1.6, delay: 0.7  },
  { top: "32%", right: "28%", size: 1.2, delay: 1.5  },
  { top: "72%", left: "5%",   size: 2.0, delay: 0.8  },
  { top: "80%", right: "8%",  size: 1.0, delay: 0.2  },
  { top: "88%", left: "34%",  size: 2.4, delay: 1.1  },
  { top: "85%", right: "24%", size: 2.8, delay: 1.6  },
  { top: "3%",  left: "54%",  size: 0.8, delay: 1.9  },
  { top: "18%", left: "70%",  size: 1.6, delay: 0.6  },
  { top: "90%", right: "40%", size: 1.6, delay: 0.1  },
];

type Particle = { id: number; x: number; y: number; color: string; angle: number };
const SPARKLE_COLORS = ["#fde047", "#fb7185", "#34d399", "#60a5fa", "#c084fc", "#f97316", "#ffffff"];

export const CartoonStoryIntro: React.FC<Props> = ({
  childName,
  storyTitle,
  theme,
  backgroundImage = null,
  onComplete,
  onSkip,
  duration = 18_000,
  readyToAdvance,
}) => {
  const [act, setAct]               = useState<Act>(1);
  const [leaving, setLeaving]       = useState(false);
  const [imgVisible, setImgVisible] = useState(false);
  const [particles, setParticles]   = useState<Particle[]>([]);
  const [elapsed, setElapsed]       = useState(0);

  const leavingRef    = useRef(false);
  const minDoneRef    = useRef(false);
  const canAdvanceRef = useRef(readyToAdvance ?? true);
  const themeLabel    = theme || "a magical adventure";

  const dismiss = (cb: () => void) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(cb, 500);
  };

  // Sync readyToAdvance → ref; dismiss if acts already completed
  useEffect(() => {
    canAdvanceRef.current = readyToAdvance ?? true;
    if (minDoneRef.current && canAdvanceRef.current) dismiss(onComplete);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToAdvance]);

  // Act transitions — acts always run on their own timers
  useEffect(() => {
    const t1 = setTimeout(() => setAct(2), ACT_1_END);
    const t2 = setTimeout(() => { setAct(3); setImgVisible(true); }, ACT_2_END);
    const t3 = setTimeout(() => setAct(4), ACT_3_END);
    const t4 = setTimeout(() => {
      minDoneRef.current = true;
      if (canAdvanceRef.current) {
        dismiss(onComplete);
      } else {
        setAct(5); // waiting state until readyToAdvance
      }
    }, Math.min(ACT_4_END, duration));
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show image once it arrives (even mid-act)
  useEffect(() => {
    if (backgroundImage && act >= 2) setImgVisible(true);
  }, [backgroundImage, act]);

  // Elapsed counter for progress bar
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => Math.min(e + 100, duration)), 100);
    return () => clearTimeout(t);
  }, []);

  // Burst particles when entering act 2 (title reveal)
  useEffect(() => {
    if (act !== 2) return;
    const burst: Particle[] = Array.from({ length: 18 }, (_, j) => ({
      id: Date.now() + j,
      x: 50 + Math.cos((j / 18) * Math.PI * 2) * (18 + (j % 4) * 8),
      y: 45 + Math.sin((j / 18) * Math.PI * 2) * (14 + (j % 3) * 8),
      color: SPARKLE_COLORS[j % SPARKLE_COLORS.length],
      angle: (j / 18) * 360,
    }));
    setParticles(burst);
    const t = setTimeout(() => setParticles([]), 1000);
    return () => clearTimeout(t);
  }, [act]);

  return (
    <>
      <style>{`
        @keyframes csiTwinkle {
          0%, 100% { opacity: 0.1;  transform: scale(0.7);  }
          50%       { opacity: 0.85; transform: scale(1.25); }
        }
        @keyframes csiFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes csiTitleIn {
          from { opacity: 0; transform: scale(0.88) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes csiFloatY {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes csiParticlePop {
          0%   { opacity: 1; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(0); }
        }
        @keyframes csiPulseRing {
          0%   { transform: scale(1);    opacity: 0.7; }
          100% { transform: scale(1.6);  opacity: 0;   }
        }
        @keyframes csiLetsBegan {
          0%   { opacity: 0; letter-spacing: 0.2em; }
          100% { opacity: 1; letter-spacing: 0.4em; }
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[100] overflow-hidden select-none transition-opacity duration-500 ${
          leaving ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Deep space gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-indigo-950 to-slate-950" />

        {/* Background story image — fades in at act 2+ */}
        {backgroundImage && (
          <div
            className="absolute inset-0 transition-opacity duration-2000"
            style={{ opacity: imgVisible ? 1 : 0 }}
          >
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.18)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-transparent to-gray-950/85" />
          </div>
        )}

        {/* Starfield */}
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white pointer-events-none"
            style={{
              top: star.top,
              ...(star.left  ? { left:  star.left  } : {}),
              ...(star.right ? { right: star.right } : {}),
              width:  star.size * 2.4 + "px",
              height: star.size * 2.4 + "px",
              animation: `csiTwinkle ${1.5 + (i % 5) * 0.4}s ease-in-out ${star.delay}s infinite alternate`,
            }}
          />
        ))}

        {/* Particle burst at title reveal */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `calc(${p.x}% - 5px)`,
              top:  `calc(${p.y}% - 5px)`,
              width: 10,
              height: 10,
              backgroundColor: p.color,
              boxShadow: `0 0 6px 2px ${p.color}88`,
              animation: "csiParticlePop 0.9s ease-out forwards",
            }}
          />
        ))}

        {/* Content area */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-8 text-center gap-4">

          {/* ACT 1 — Personalised greeting */}
          {act === 1 && (
            <div key="act1" style={{ animation: "csiFadeIn 0.9s ease-out both" }} className="flex flex-col items-center gap-3">
              <div className="text-5xl" style={{ animation: "csiFloatY 4s ease-in-out infinite" }}>
                🌙
              </div>
              {childName && (
                <p className="text-white/40 text-sm tracking-[0.3em] uppercase">
                  Tonight&rsquo;s story for
                </p>
              )}
              <p className="text-white text-3xl font-bold" style={{ animation: "csiFadeIn 0.9s ease-out 0.4s both" }}>
                {childName || "You"}
              </p>
            </div>
          )}

          {/* ACT 2 — Big title card */}
          {act === 2 && (
            <div key="act2" className="flex flex-col items-center gap-4">
              <p
                className="text-white/35 text-xs tracking-[0.35em] uppercase"
                style={{ animation: "csiFadeIn 0.7s ease-out both" }}
              >
                ✦ &nbsp; Tonight&rsquo;s Story &nbsp; ✦
              </p>
              <h1
                className="text-white text-4xl sm:text-5xl font-bold leading-tight"
                style={{ animation: "csiTitleIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s both, csiFloatY 5s ease-in-out 1.5s infinite" }}
              >
                {storyTitle}
              </h1>
              {/* Pulse ring behind title */}
              <div className="relative flex items-center justify-center mt-2">
                <div className="absolute w-16 h-16 rounded-full border border-white/20" style={{ animation: "csiPulseRing 1.6s ease-out infinite" }} />
                <div className="absolute w-16 h-16 rounded-full border border-amber-300/15" style={{ animation: "csiPulseRing 1.6s ease-out 0.5s infinite" }} />
                <span className="text-2xl">✨</span>
              </div>
            </div>
          )}

          {/* ACT 3 — Tagline */}
          {act === 3 && (
            <div key="act3" className="flex flex-col items-center gap-3">
              <h1
                className="text-white text-4xl sm:text-5xl font-bold leading-tight"
                style={{ opacity: 0.85, animation: "csiFloatY 5s ease-in-out infinite" }}
              >
                {storyTitle}
              </h1>
              <p
                className="text-white/60 text-base font-medium"
                style={{ animation: "csiFadeIn 0.7s ease-out 0.2s both" }}
              >
                A magical bedtime adventure
              </p>
              <p
                className="text-white/35 text-sm capitalize"
                style={{ animation: "csiFadeIn 0.7s ease-out 0.6s both" }}
              >
                {themeLabel}
              </p>
            </div>
          )}

          {/* ACT 4 — Let's begin */}
          {act === 4 && (
            <div key="act4" className="flex flex-col items-center gap-5">
              <div className="text-5xl" style={{ animation: "csiFloatY 2s ease-in-out infinite" }}>
                🌟
              </div>
              <p
                className="text-white text-2xl font-bold uppercase"
                style={{ animation: "csiLetsBegan 0.8s ease-out both", letterSpacing: "0.4em" }}
              >
                Let&rsquo;s Begin
              </p>
              <p
                className="text-white/40 text-sm"
                style={{ animation: "csiFadeIn 0.7s ease-out 0.5s both" }}
              >
                {childName ? `Sweet dreams, ${childName}…` : "Sweet dreams…"}
              </p>
            </div>
          )}

          {/* ACT 5 — Waiting state: story images still generating */}
          {act === 5 && (
            <div key="act5" className="flex flex-col items-center gap-4">
              <div
                className="text-5xl"
                style={{ animation: "csiFloatY 3s ease-in-out infinite" }}
              >
                ✨
              </div>
              <p
                className="text-white/70 text-lg font-medium"
                style={{ animation: "csiFadeIn 0.6s ease-out both" }}
              >
                Almost ready…
              </p>
              <p
                className="text-white/35 text-sm"
                style={{ animation: "csiFadeIn 0.6s ease-out 0.4s both" }}
              >
                Painting the final scenes
              </p>
              {/* Dots pulse */}
              <div className="flex gap-1.5 mt-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/40"
                    style={{ animation: `csiPulseRing 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Skip button — always visible */}
        <button
          onClick={() => dismiss(onSkip)}
          className="absolute top-4 right-4 z-30 px-4 py-1.5 rounded-full border border-white/15 text-white/35 text-xs tracking-wider hover:border-white/35 hover:text-white/55 transition-colors"
        >
          Skip
        </button>

        {/* Thin progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 transition-all duration-100 linear"
            style={{ width: `${(elapsed / duration) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
};
