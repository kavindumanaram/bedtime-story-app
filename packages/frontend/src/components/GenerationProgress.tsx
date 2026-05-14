import React, { useState, useEffect, useRef } from "react";

const WRITING_MESSAGES = [
  { icon: "🌀", text: "Searching the Hushtales archives for a suitable shadow..." },
  { icon: "✍️", text: "Inking the protagonist's deepest fears into the parchment..." },
  { icon: "🕯️", text: "Lighting the lanterns in the forgotten corridor..." },
  { icon: "📜", text: "Weaving the final thread of the plot twist..." },
  { icon: "🌑", text: "Consulting the moon's reflection for the perfect ending..." },
  { icon: "🗝️", text: "Unlocking the chamber where all good stories sleep..." },
  { icon: "🪶", text: "Dipping the quill into the ink of imagination..." },
  { icon: "🌫️", text: "Summoning characters from the mist between worlds..." },
  { icon: "📖", text: "Binding the chapters with a whisper and a wish..." },
  { icon: "🌙", text: "Pressing the final seal upon the tale..." },
];

const PAINTING_MESSAGES = [
  { icon: "🎨", text: "Mixing the perfect shade of twilight blue..." },
  { icon: "🖌️", text: "Brushing the hero's expression onto the canvas..." },
  { icon: "✨", text: "Sprinkling stardust across the opening scene..." },
  { icon: "🌙", text: "Painting the moonlit path through the forest..." },
  { icon: "🖼️", text: "Framing the most dramatic moment just right..." },
  { icon: "🎭", text: "Adding shadows to give the scene its depth..." },
  { icon: "🌈", text: "Layering the dawn colours on the horizon..." },
  { icon: "🦋", text: "Letting the characters find their light..." },
  { icon: "🏰", text: "Detailing the castle stones with a fine brush..." },
  { icon: "🌟", text: "Illuminating the story's most magical moment..." },
];

const WRITING_SENSORY = [
  "The scent of old parchment and cedar drifts through the archive...",
  "A distant creek murmurs beneath the tower floor...",
  "Candlewax drips softly onto cold stone...",
  "The rustle of turning pages fills the hollow silence...",
  "A single raven watches from the high window...",
];

const PAINTING_SENSORY = [
  "The soft smell of fresh paint drifts through the studio...",
  "A fine brush sweeps slowly across the canvas...",
  "Colours bloom quietly under the lamp's warm glow...",
  "Each stroke reveals a little more of the world within...",
  "The artist holds their breath as the scene takes shape...",
];

interface Props {
  phase: "writing" | "painting";
  coverImage: string | null;
  childName?: string;
  readyCount?: number;
  sceneCount?: number;
}

export const GenerationProgress: React.FC<Props> = ({ phase, coverImage, childName, readyCount = 0, sceneCount = 0 }) => {
  const [log, setLog] = useState<{ icon: string; text: string; id: number }[]>([]);
  const [sensory, setSensory] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(3);
  const [flicker, setFlicker] = useState(false);
  const counterRef = useRef(0);
  const usedRef = useRef<Set<number>>(new Set());

  const STATUS_MESSAGES = phase === "painting" ? PAINTING_MESSAGES : WRITING_MESSAGES;
  const SENSORY_HOOKS = phase === "painting" ? PAINTING_SENSORY : WRITING_SENSORY;

  const realProgress = sceneCount > 0 ? Math.round((readyCount / sceneCount) * 100) : 0;
  const progress = sceneCount > 0 ? realProgress : fakeProgress;
  const progressLabel = sceneCount > 0
    ? `${readyCount} of ${sceneCount} scenes painted`
    : "pages inked...";

  useEffect(() => {
    setLog([]);
    setFakeProgress(3);
    usedRef.current = new Set();
    counterRef.current = 0;

    const addMessage = () => {
      const remaining = STATUS_MESSAGES.map((_, i) => i).filter(i => !usedRef.current.has(i));
      if (remaining.length === 0) return;
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      usedRef.current.add(pick);
      const entry = { ...STATUS_MESSAGES[pick], id: counterRef.current++ };
      setLog(prev => [...prev.slice(-3), entry]);
    };

    addMessage();
    const msgTimer = setInterval(addMessage, 2800);

    const progTimer = setInterval(() => {
      setFakeProgress(p => Math.min(p + 1.4, 88));
    }, 420);

    const sensoryTimer = setInterval(() => {
      setSensory(s => (s + 1) % SENSORY_HOOKS.length);
    }, 5000);

    const flickerTimer = setInterval(() => {
      setFlicker(f => !f);
    }, 120 + Math.random() * 300);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progTimer);
      clearInterval(sensoryTimer);
      clearInterval(flickerTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "painting" && coverImage !== null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        <img src={coverImage} alt="Story cover" className="w-48 h-48 rounded-2xl object-cover shadow-lg" />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Sealing the final chapter...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes candleFlame {
          0%,100% { transform: scaleX(1) scaleY(1) rotate(-1deg); }
          25%      { transform: scaleX(0.92) scaleY(1.08) rotate(2deg); }
          75%      { transform: scaleX(1.07) scaleY(0.95) rotate(-2deg); }
        }
        @keyframes waxDrip {
          0%   { transform: translateY(0); opacity: 0.7; }
          100% { transform: translateY(12px); opacity: 0; }
        }
        @keyframes logSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sensoryFade {
          0%,100% { opacity: 0; }
          20%,80% { opacity: 1; }
        }
        @keyframes runeFloat {
          0%,100% { opacity: 0.08; transform: translateY(0); }
          50%      { opacity: 0.22; transform: translateY(-6px); }
        }
        @keyframes orbPulse {
          0%,100% { opacity: 0.18; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(1.12); }
        }
        @keyframes inkDrop {
          0%   { transform: scaleY(0); opacity: 1; }
          100% { transform: scaleY(1); opacity: 0.6; }
        }
        @keyframes brushSway {
          0%,100% { transform: rotate(-8deg) translateY(0px); }
          30%      { transform: rotate(6deg) translateY(-4px); }
          70%      { transform: rotate(-4deg) translateY(2px); }
        }
        @keyframes paintDot {
          0%   { transform: scale(0); opacity: 0.9; }
          60%  { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes strokeSlide {
          0%   { width: 0; opacity: 0.8; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>

      <div
        className="relative flex flex-col items-center w-full overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(160deg,#0c0b1a,#130f23,#0a0f1e)",
          minHeight: 400,
          padding: "2.5rem 1.5rem",
        }}
      >
        {/* Background runes */}
        {["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ"].map((r, i) => (
          <span key={i} style={{
            position: "absolute",
            top: `${12 + i * 14}%`,
            left: i % 2 === 0 ? `${5 + i * 3}%` : undefined,
            right: i % 2 !== 0 ? `${5 + i * 3}%` : undefined,
            fontSize: 22,
            color: "#c4b5fd",
            pointerEvents: "none",
            userSelect: "none",
            animation: `runeFloat ${3 + i * 0.7}s ease-in-out ${i * 0.5}s infinite`,
          }}>{r}</span>
        ))}

        {/* Glow orb */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translate(-50%,-50%)",
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(124,58,237,0.22) 0%,transparent 70%)",
          animation: "orbPulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Writing: Candle — Painting: Brush + palette dots */}
        {phase !== "painting" ? (
          <div className="relative flex flex-col items-center mb-6" style={{ zIndex: 10 }}>
            <div style={{
              width: 14, height: 22, borderRadius: "50% 50% 35% 35%",
              background: "linear-gradient(to top,#f59e0b,#fde68a,#fff)",
              boxShadow: "0 0 12px 4px rgba(245,158,11,0.5), 0 0 24px 8px rgba(245,158,11,0.2)",
              animation: "candleFlame 0.9s ease-in-out infinite",
              opacity: flicker ? 0.88 : 1,
              transition: "opacity 0.06s",
            }} />
            <div style={{
              width: 3, height: 10,
              background: "linear-gradient(to bottom,rgba(251,191,36,0.8),transparent)",
              borderRadius: "0 0 4px 4px",
              animation: "waxDrip 2.4s ease-in infinite",
            }} />
            <div style={{
              width: 18, height: 56,
              background: "linear-gradient(to bottom,#e2e8f0,#cbd5e1)",
              borderRadius: "4px 4px 2px 2px",
              boxShadow: "inset -3px 0 6px rgba(0,0,0,0.15)",
            }} />
            <div style={{
              width: 26, height: 6, borderRadius: 4,
              background: "linear-gradient(to bottom,#94a3b8,#64748b)",
              marginTop: 2,
            }} />
          </div>
        ) : (
          <div className="relative flex flex-col items-center mb-6" style={{ zIndex: 10 }}>
            {/* Brush */}
            <div style={{
              animation: "brushSway 2.2s ease-in-out infinite",
              transformOrigin: "50% 0%",
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              {/* Brush tip bristles */}
              <div style={{
                width: 10, height: 18, borderRadius: "30% 30% 60% 60%",
                background: `linear-gradient(to bottom,#a78bfa,#7c3aed)`,
                boxShadow: "0 0 10px 3px rgba(124,58,237,0.5)",
                opacity: flicker ? 0.9 : 1,
                transition: "opacity 0.08s",
              }} />
              {/* Ferrule */}
              <div style={{ width: 12, height: 8, background: "linear-gradient(to bottom,#94a3b8,#64748b)", borderRadius: 2 }} />
              {/* Handle */}
              <div style={{
                width: 8, height: 48,
                background: "linear-gradient(to bottom,#fde68a,#d97706)",
                borderRadius: "2px 2px 4px 4px",
                boxShadow: "inset -2px 0 4px rgba(0,0,0,0.2)",
              }} />
            </div>
            {/* Paint splash dots */}
            {[
              { color: "#7c3aed", x: -24, y: -8, delay: "0s" },
              { color: "#06b6d4", x: 22, y: -4, delay: "0.8s" },
              { color: "#f59e0b", x: -14, y: 12, delay: "1.4s" },
            ].map((dot, i) => (
              <div key={i} style={{
                position: "absolute",
                width: 7, height: 7, borderRadius: "50%",
                background: dot.color,
                top: "50%", left: "50%",
                transform: `translate(${dot.x}px, ${dot.y}px)`,
                animation: `paintDot 2.4s ease-out ${dot.delay} infinite`,
                pointerEvents: "none",
              }} />
            ))}
          </div>
        )}

        {/* Child name */}
        {childName && (
          <p style={{ color: "rgba(196,181,253,0.7)", fontSize: 12, marginBottom: 8, letterSpacing: "0.08em" }}>
            {phase === "painting" ? "Painting scenes for " : "The Engine weaves a tale for "}{" "}
            <span style={{ color: "#c4b5fd", fontWeight: 700 }}>{childName}</span>
          </p>
        )}

        {/* Terminal log */}
        <div
          className="w-full max-w-sm rounded-xl mb-5"
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(196,181,253,0.12)",
            padding: "1rem",
            fontFamily: "'Courier New', Courier, monospace",
            minHeight: 120,
            backdropFilter: "blur(4px)",
          }}
        >
          {/* Terminal title bar */}
          <div className="flex items-center gap-1.5 mb-3" style={{ borderBottom: "1px solid rgba(196,181,253,0.08)", paddingBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", opacity: 0.7 }} />
            <span style={{ color: "rgba(196,181,253,0.4)", fontSize: 10, marginLeft: 6, letterSpacing: "0.1em" }}>
              hushtales.engine — {phase === "painting" ? "scene_painter" : "story_architect"}
            </span>
          </div>

          {log.map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                marginBottom: 6,
                animation: "logSlideIn 0.4s ease-out both",
                opacity: idx === log.length - 1 ? 1 : 0.45 + idx * 0.15,
              }}
            >
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{entry.icon}</span>
              <span style={{
                color: idx === log.length - 1 ? "#c4b5fd" : "rgba(148,163,184,0.7)",
                fontSize: 11,
                lineHeight: 1.5,
                fontStyle: "italic",
              }}>
                {entry.text}
              </span>
            </div>
          ))}

          {/* Blinking cursor */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ color: "#7c3aed", fontSize: 11 }}>▶</span>
            <div style={{
              width: 7, height: 13, background: "#c4b5fd", borderRadius: 1,
              animation: "candleFlame 0.8s step-start infinite",
              opacity: 0.8,
            }} />
          </div>
        </div>

        {/* Sensory hook */}
        <p
          key={sensory}
          style={{
            color: "rgba(196,181,253,0.55)",
            fontSize: 11,
            fontStyle: "italic",
            textAlign: "center",
            maxWidth: 280,
            marginBottom: 20,
            letterSpacing: "0.03em",
            animation: "sensoryFade 5s ease-in-out both",
          }}
        >
          {SENSORY_HOOKS[sensory]}
        </p>

        {/* Progress — styled as pages */}
        <div className="w-full max-w-sm space-y-2">
          <div style={{
            height: 4, borderRadius: 4,
            background: "rgba(196,181,253,0.1)",
            overflow: "hidden",
            border: "1px solid rgba(196,181,253,0.08)",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 4,
              background: "linear-gradient(to right,#7c3aed,#c4b5fd,#06b6d4)",
              boxShadow: "0 0 8px 2px rgba(124,58,237,0.5)",
              transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: "rgba(196,181,253,0.35)",
            fontFamily: "'Courier New', Courier, monospace",
            letterSpacing: "0.05em",
          }}>
            <span>{progressLabel}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </>
  );
};
