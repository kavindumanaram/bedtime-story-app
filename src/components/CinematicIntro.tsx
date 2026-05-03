import React, { useState, useEffect, useRef } from "react";

interface Props {
  childName: string;
  storyTitle: string;
  duration?: number;       // hard max before auto-dismiss (ms)
  minDuration?: number;    // earliest a tap or forceDismiss can close the intro (ms)
  forceDismiss?: boolean;
  enterFullscreen?: boolean;
  backgroundImage?: string | null;
  onDone: () => void;
}

const MAGIC_MESSAGES = [
  "✨ Weaving your story with magic...",
  "🌙 Your adventure is being painted by moonlight...",
  "⭐ Your characters are coming to life...",
  "🌟 The perfect tale is almost ready...",
  "🦋 Magic words are falling into place...",
  "🌈 Painting your bedtime world...",
  "🎭 Your story is getting dressed for you...",
  "🌠 A shooting star is carrying your wish...",
];

const SPARKLE_COLORS = ["#fde047", "#fb7185", "#34d399", "#60a5fa", "#c084fc", "#f97316", "#ffffff"];

type StarDef = { top: string; left?: string; right?: string; size: number; delay: number };
const STAR_FIELD: StarDef[] = [
  { top: "5%",  left: "8%",  size: 1.5, delay: 0   },
  { top: "10%", left: "25%", size: 2.5, delay: 0.5 },
  { top: "8%",  right: "15%",size: 1.5, delay: 0.8 },
  { top: "15%", right: "8%", size: 3,   delay: 0.3 },
  { top: "20%", left: "45%", size: 1,   delay: 1.1 },
  { top: "25%", left: "12%", size: 2,   delay: 0.6 },
  { top: "30%", right: "30%",size: 1.5, delay: 1.4 },
  { top: "38%", left: "5%",  size: 2.5, delay: 0.9 },
  { top: "42%", right: "5%", size: 1,   delay: 0.2 },
  { top: "55%", left: "18%", size: 3,   delay: 1.7 },
  { top: "60%", right: "20%",size: 1.5, delay: 0.4 },
  { top: "68%", left: "7%",  size: 2,   delay: 1.2 },
  { top: "72%", right: "7%", size: 1,   delay: 0.7 },
  { top: "80%", left: "35%", size: 2.5, delay: 1.0 },
  { top: "85%", right: "25%",size: 3,   delay: 1.5 },
  { top: "90%", left: "60%", size: 1.5, delay: 0.3 },
  { top: "3%",  left: "55%", size: 1,   delay: 1.8 },
  { top: "18%", left: "70%", size: 2,   delay: 0.6 },
  { top: "50%", left: "80%", size: 1.5, delay: 1.3 },
  { top: "92%", right: "40%",size: 2,   delay: 0.1 },
];

type ShootingStarDef = { x: string; y: string; angle: number; delay: number };
const SHOOTING_STARS: ShootingStarDef[] = [
  { x: "12%", y: "8%",  angle: 35, delay: 6  },
  { x: "55%", y: "4%",  angle: 28, delay: 15 },
  { x: "30%", y: "20%", angle: 40, delay: 23 },
];

type Particle = { id: number; x: number; y: number; color: string };

export const CinematicIntro: React.FC<Props> = ({
  childName,
  storyTitle,
  duration = 60000,
  minDuration = 0,
  forceDismiss = false,
  enterFullscreen = false,
  backgroundImage = null,
  onDone,
}) => {
  const [leaving, setLeaving]       = useState(false);
  const [canDismiss, setCanDismiss] = useState(minDuration === 0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [particles, setParticles]   = useState<Particle[]>([]);

  const leavingRef      = useRef(false);
  const canDismissRef   = useRef(minDuration === 0);
  const pendingRef      = useRef(false);

  const dismiss = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    // Exit any document-level fullscreen so the player shows in normal mode
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setTimeout(onDone, 500);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Always create a cheerful sparkle burst at the tap point
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const baseId = Date.now();
    const burst: Particle[] = Array.from({ length: 12 }, (_, j) => {
      const angle = (j / 12) * Math.PI * 2;
      const r = 18 + (j % 4) * 10;
      return {
        id: baseId + j,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        color: SPARKLE_COLORS[(baseId + j) % SPARKLE_COLORS.length],
      };
    });
    setParticles((prev) => [...prev, ...burst]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id < baseId || p.id >= baseId + 12)), 900);

    if (canDismissRef.current) {
      if (enterFullscreen) document.documentElement.requestFullscreen?.().catch(() => {});
      dismiss();
    }
  };

  // Min-duration gate: earliest the intro can close
  useEffect(() => {
    if (minDuration === 0) return;
    const t = setTimeout(() => {
      canDismissRef.current = true;
      setCanDismiss(true);
    }, minDuration);
    return () => clearTimeout(t);
  }, []);

  // Hard max auto-dismiss
  useEffect(() => {
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, []);

  // forceDismiss: close immediately if gate passed, else queue
  useEffect(() => {
    if (!forceDismiss) return;
    if (canDismissRef.current) { dismiss(); }
    else { pendingRef.current = true; }
  }, [forceDismiss]);

  // When gate opens, check if a dismiss was pending
  useEffect(() => {
    if (canDismiss && pendingRef.current) dismiss();
  }, [canDismiss]);

  // Fullscreen on mount
  useEffect(() => {
    if (enterFullscreen) document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  // Rotate magic messages every 4 s
  useEffect(() => {
    const t = setInterval(() => setMessageIdx((i) => (i + 1) % MAGIC_MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Lullaby sound — loop melody 7 times for ~28 s coverage
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
      masterGain.gain.linearRampToValueAtTime(0.13, ctx.currentTime + 0.4);
      masterGain.connect(ctx.destination);

      // Pentatonic lullaby: C5 E5 G5 A5 G5 E5 C5 E5
      const melody = [523.25, 659.25, 783.99, 880.00, 783.99, 659.25, 523.25, 659.25];
      const LOOPS = 7;
      const LOOP_STEP = 3.96; // 8 notes × 0.48s + small gap

      for (let loop = 0; loop < LOOPS; loop++) {
        const vol = loop < LOOPS - 1 ? 0.7 : 0.3; // fade last loop
        melody.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          const t = ctx.currentTime + 0.15 + loop * LOOP_STEP + i * 0.48;
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(vol, t + 0.06);
          env.gain.exponentialRampToValueAtTime(0.001, t + 0.44);
          osc.connect(env);
          env.connect(masterGain!);
          osc.start(t);
          osc.stop(t + 0.5);
        });
      }

      // Ambient drone: C2 + G2 (an octave lower for warmth)
      [65.41, 98.00].forEach((f) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        env.gain.setValueAtTime(0, ctx.currentTime);
        env.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 1.5);
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
        masterGain.gain.linearRampToValueAtTime(0, t + 0.5);
      }
      setTimeout(() => { ctx.close().catch(() => {}); }, 700);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes cinematicFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes messageFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes twinkle {
          from { opacity: 0.12; transform: scale(0.75); }
          to   { opacity: 0.9;  transform: scale(1.25); }
        }
        @keyframes particlePop {
          0%   { opacity: 1; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(0); }
        }
        @keyframes shootStar {
          0%   { opacity: 0; width: 0; }
          15%  { opacity: 1; }
          100% { opacity: 0; width: 90px; }
        }
        @keyframes progressGrow {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[100] overflow-hidden cursor-pointer select-none transition-opacity duration-500 ${
          leaving ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        onClick={handleClick}
      >
        {/* Deep space gradient base */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950" />

        {/* Story image fades in when generated — very dark so text stays readable */}
        {backgroundImage && (
          <div className="absolute inset-0">
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover transition-opacity duration-1500"
              style={{ filter: "brightness(0.22)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/65 via-transparent to-slate-950/80" />
          </div>
        )}

        {/* Starfield */}
        {STAR_FIELD.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              ...(star.left  ? { left:  star.left  } : {}),
              ...(star.right ? { right: star.right } : {}),
              width:  star.size * 2.5 + "px",
              height: star.size * 2.5 + "px",
              animation: `twinkle ${1.4 + (i % 5) * 0.4}s ease-in-out ${star.delay}s infinite alternate`,
            }}
          />
        ))}

        {/* Shooting stars */}
        {SHOOTING_STARS.map((s, i) => (
          <div
            key={i}
            className="absolute h-px"
            style={{
              left: s.x,
              top:  s.y,
              width: 0,
              background: "linear-gradient(to right, transparent, white, transparent)",
              transform: `rotate(${s.angle}deg)`,
              transformOrigin: "left center",
              animation: `shootStar 0.7s ease-out ${s.delay}s both`,
            }}
          />
        ))}

        {/* Tap sparkle particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: p.x - 5,
              top:  p.y - 5,
              width:  10,
              height: 10,
              backgroundColor: p.color,
              boxShadow: `0 0 6px 2px ${p.color}88`,
              animation: "particlePop 0.85s ease-out forwards",
            }}
          />
        ))}

        {/* Main content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-8 text-center gap-5">
          {childName && (
            <p
              className="text-white/50 text-sm tracking-[0.28em] uppercase"
              style={{ animation: "cinematicFadeIn 0.9s ease-out both" }}
            >
              Tonight&rsquo;s story for {childName}
            </p>
          )}

          <h1
            className="text-white text-4xl sm:text-5xl font-bold leading-tight"
            style={{ animation: "cinematicFadeIn 0.9s ease-out 0.5s both, floatY 5s ease-in-out 2s infinite" }}
          >
            {storyTitle}
          </h1>

          {/* Rotating status message */}
          <p
            key={messageIdx}
            className="text-white/65 text-sm"
            style={{ animation: "messageFade 0.6s ease-out both" }}
          >
            {MAGIC_MESSAGES[messageIdx]}
          </p>

          {/* "TAP TO BEGIN" appears only after minDuration passes */}
          <p
            className="text-white/35 text-xs tracking-widest uppercase transition-opacity duration-1000"
            style={{ opacity: canDismiss ? 1 : 0, animation: canDismiss ? "cinematicFadeIn 0.8s ease-out both" : undefined }}
          >
            ✦ Tap anywhere to begin ✦
          </p>

          <p
            className="text-white/20 text-[10px] tracking-[0.3em] uppercase"
            style={{ animation: "cinematicFadeIn 0.9s ease-out 2.5s both" }}
          >
            By HushTales &bull; AI Generated
          </p>
        </div>

        {/* Rainbow progress bar — fills over `duration` ms, shows time passing */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-blue-400 via-emerald-400 to-rose-400"
            style={{ width: 0, animation: `progressGrow ${duration}ms linear forwards` }}
          />
        </div>
      </div>
    </>
  );
};
