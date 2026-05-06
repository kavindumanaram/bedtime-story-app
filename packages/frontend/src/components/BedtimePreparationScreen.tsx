import React, { useState, useEffect, useRef } from "react";

interface Props {
  childName: string;
  storyTitle: string;
  theme: string;
  onComplete: () => void;
  onSkip: () => void;
  /** Minimum time shown before completion is allowed (ms). Default 35 000. */
  minDurationMs?: number;
  /** When true AND minDurationMs has elapsed, auto-completes. Default: auto-complete when timer fires. */
  readyToAdvance?: boolean;
  skipAfterMs?: number;
}

const PREP_MESSAGES = [
  "🛏️ Time to get cozy...",
  "🌙 Fluffing your pillows...",
  "🧸 Grab your favourite teddy...",
  "⭐ The stars are peeking out...",
  "🕯️ Dimming the lights just right...",
  "🌛 The moon is ready to watch over you...",
  "🦉 The wise old owl nods goodnight...",
  "🌟 Magic is filling the air tonight...",
  "✨ Your adventure is almost ready...",
  "🌙 Getting everything perfect for you...",
];

type StarDef = { top: string; left?: string; right?: string; size: number; delay: number };
const STAR_FIELD: StarDef[] = [
  { top: "4%",  left: "6%",   size: 1.4, delay: 0    },
  { top: "8%",  left: "22%",  size: 2.2, delay: 0.5  },
  { top: "6%",  right: "12%", size: 1.6, delay: 0.9  },
  { top: "14%", right: "6%",  size: 2.8, delay: 0.3  },
  { top: "18%", left: "42%",  size: 1.0, delay: 1.2  },
  { top: "22%", left: "10%",  size: 1.8, delay: 0.7  },
  { top: "28%", right: "28%", size: 1.4, delay: 1.5  },
  { top: "35%", left: "4%",   size: 2.2, delay: 1.0  },
  { top: "40%", right: "4%",  size: 0.9, delay: 0.2  },
  { top: "50%", left: "16%",  size: 2.6, delay: 1.8  },
  { top: "58%", right: "18%", size: 1.4, delay: 0.4  },
  { top: "65%", left: "6%",   size: 1.8, delay: 1.3  },
  { top: "70%", right: "6%",  size: 0.9, delay: 0.8  },
  { top: "78%", left: "32%",  size: 2.2, delay: 1.1  },
  { top: "82%", right: "22%", size: 2.6, delay: 1.6  },
  { top: "88%", left: "58%",  size: 1.4, delay: 0.3  },
  { top: "2%",  left: "52%",  size: 0.9, delay: 1.9  },
  { top: "16%", left: "68%",  size: 1.8, delay: 0.6  },
  { top: "48%", left: "78%",  size: 1.4, delay: 1.4  },
  { top: "90%", right: "38%", size: 1.8, delay: 0.1  },
];

type CloudDef = { top: string; left: string; width: string; delay: number; dur: number };
const CLOUDS: CloudDef[] = [
  { top: "15%", left: "-8%",  width: "180px", delay: 0,   dur: 28 },
  { top: "35%", left: "-12%", width: "140px", delay: 8,   dur: 35 },
  { top: "60%", left: "-10%", width: "160px", delay: 18,  dur: 30 },
];

export const BedtimePreparationScreen: React.FC<Props> = ({
  childName,
  storyTitle,
  minDurationMs = 35_000,
  readyToAdvance,
  skipAfterMs = 10_000,
  onComplete,
  onSkip,
}) => {
  const [leaving, setLeaving]       = useState(false);
  const [canSkip, setCanSkip]       = useState(false);
  const [messageIdx, setMessageIdx] = useState(0);
  const [elapsed, setElapsed]       = useState(0);

  const leavingRef    = useRef(false);
  const minDoneRef    = useRef(false);
  // undefined readyToAdvance → behave as always-ready (original auto-complete)
  const canAdvanceRef = useRef(readyToAdvance ?? true);

  const dismiss = (cb: () => void) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(cb, 600);
  };

  // Sync readyToAdvance prop → ref; attempt dismiss if min-duration already passed
  useEffect(() => {
    canAdvanceRef.current = readyToAdvance ?? true;
    if (minDoneRef.current && canAdvanceRef.current) dismiss(onComplete);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToAdvance]);

  // Min-duration timer: once elapsed, dismiss only if readyToAdvance
  useEffect(() => {
    const t = setTimeout(() => {
      minDoneRef.current = true;
      if (canAdvanceRef.current) dismiss(onComplete);
    }, minDurationMs);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skip-gate timer
  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), skipAfterMs);
    return () => clearTimeout(t);
  }, []);

  // Message rotation
  useEffect(() => {
    const t = setInterval(() => setMessageIdx((i) => (i + 1) % PREP_MESSAGES.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Elapsed counter for progress bar (caps at minDurationMs for display)
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => Math.min(e + 100, minDurationMs)), 100);
    return () => clearInterval(t);
  }, []);

  // Soft lullaby using Web Audio API
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtxClass = (window.AudioContext ?? (window as any).webkitAudioContext) as (typeof AudioContext) | undefined;
    if (!AudioCtxClass) return;
    let ctx: AudioContext;
    try { ctx = new AudioCtxClass(); } catch { return; }

    let masterGain: GainNode | null = null;
    let alive = true;

    void ctx.resume().then(() => {
      if (!alive) return;

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.8);
      masterGain.connect(ctx.destination);

      // Gentle rocking lullaby: G4 B4 D5 G5 D5 B4 G4 B4
      const melody = [392.00, 493.88, 587.33, 783.99, 587.33, 493.88, 392.00, 493.88];
      const LOOPS = 8;
      const LOOP_STEP = 4.2;

      for (let loop = 0; loop < LOOPS; loop++) {
        const vol = loop < LOOPS - 1 ? 0.65 : 0.25;
        melody.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          const t = ctx.currentTime + 0.2 + loop * LOOP_STEP + i * 0.52;
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(vol, t + 0.08);
          env.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
          osc.connect(env);
          env.connect(masterGain!);
          osc.start(t);
          osc.stop(t + 0.55);
        });
      }

      // Soft bass drone: G2
      [98.00, 146.83].forEach((f) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        env.gain.setValueAtTime(0, ctx.currentTime);
        env.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2);
        osc.connect(env);
        env.connect(masterGain!);
        osc.start();
      });
    });

    return () => {
      alive = false;
      if (masterGain) {
        const t = ctx.currentTime;
        masterGain.gain.setValueAtTime(masterGain.gain.value, t);
        masterGain.gain.linearRampToValueAtTime(0, t + 0.6);
      }
      setTimeout(() => ctx.close().catch(() => {}), 800);
    };
  }, []);

  const progress = Math.min((elapsed / minDurationMs) * 100, 100);

  return (
    <>
      <style>{`
        @keyframes prepFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes prepMsgFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes prepTwinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.7); }
          50%       { opacity: 0.85; transform: scale(1.3); }
        }
        @keyframes moonFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50%       { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes cloudDrift {
          from { transform: translateX(0); }
          to   { transform: translateX(110vw); }
        }
        @keyframes prepProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes skipFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[100] overflow-hidden select-none transition-opacity duration-600 ${
          leaving ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Deep warm night sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-gray-950" />

        {/* Drifting clouds */}
        {CLOUDS.map((c, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              top: c.top,
              left: c.left,
              width: c.width,
              height: "60px",
              borderRadius: "50px",
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, transparent 70%)",
              animation: `cloudDrift ${c.dur}s linear ${c.delay}s infinite`,
            }}
          />
        ))}

        {/* Starfield */}
        {STAR_FIELD.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              ...(star.left  ? { left:  star.left  } : {}),
              ...(star.right ? { right: star.right } : {}),
              width:  star.size * 2.4 + "px",
              height: star.size * 2.4 + "px",
              animation: `prepTwinkle ${1.5 + (i % 5) * 0.4}s ease-in-out ${star.delay}s infinite alternate`,
            }}
          />
        ))}

        {/* Main content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-8 text-center gap-6">
          {/* Moon */}
          <div
            className="text-7xl select-none"
            style={{ animation: "moonFloat 5s ease-in-out infinite" }}
          >
            🌙
          </div>

          {/* Personalised greeting */}
          <div style={{ animation: "prepFadeIn 1s ease-out 0.3s both" }}>
            {childName && (
              <p className="text-white/45 text-sm tracking-[0.25em] uppercase mb-2">
                Storytime for {childName}
              </p>
            )}
            <p className="text-white/80 text-base font-medium leading-snug">
              Tonight&rsquo;s adventure:{" "}
              <span className="text-amber-300 font-semibold">&ldquo;{storyTitle}&rdquo;</span>
            </p>
          </div>

          {/* Rotating preparation message */}
          <p
            key={messageIdx}
            className="text-white/65 text-sm"
            style={{ animation: "prepMsgFade 0.6s ease-out both" }}
          >
            {PREP_MESSAGES[messageIdx]}
          </p>

          {/* Instructions */}
          <p
            className="text-white/30 text-xs tracking-widest uppercase"
            style={{ animation: "prepFadeIn 1s ease-out 2s both" }}
          >
            ✦ Snuggle up ✦ Close your eyes ✦
          </p>

          {/* Skip button — appears after skipAfterMs */}
          <button
            onClick={() => dismiss(onSkip)}
            className="px-5 py-2 rounded-full border border-white/20 text-white/50 text-xs tracking-wider hover:border-white/40 hover:text-white/70 transition-colors"
            style={{
              opacity: canSkip ? 1 : 0,
              pointerEvents: canSkip ? "auto" : "none",
              animation: canSkip ? "skipFadeIn 0.8s ease-out both" : undefined,
            }}
          >
            Skip intro
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 via-pink-400 to-amber-300 transition-all duration-100 linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </>
  );
};
