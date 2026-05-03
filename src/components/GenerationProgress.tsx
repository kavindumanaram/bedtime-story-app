import React, { useState, useEffect } from "react";
import { Sparkles, Palette } from "lucide-react";

const WRITING_MESSAGES = [
  "Once upon a time...",
  "Creating your characters...",
  "Writing the adventure...",
  "Adding the magical details...",
  "Almost ready...",
];

const PAINTING_MESSAGES = [
  "Drawing the magical forest...",
  "Painting the night sky...",
  "Adding the finishing touches...",
];

interface Props {
  phase: "writing" | "painting";
  coverImage: string | null;
}

export const GenerationProgress: React.FC<Props> = ({ phase, coverImage }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(phase === "writing" ? 5 : 88);

  useEffect(() => {
    const msgs = phase === "writing" ? WRITING_MESSAGES : PAINTING_MESSAGES;
    const maxProg = phase === "writing" ? 88 : 97;
    setMessageIndex(0);
    setProgress(phase === "writing" ? 5 : 88);

    const msgInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % msgs.length);
    }, 3000);

    const progInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 1.5, maxProg));
    }, 400);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
    };
  }, [phase]);

  const messages = phase === "writing" ? WRITING_MESSAGES : PAINTING_MESSAGES;

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-8 w-full">
      {phase === "writing" ? (
        <div className="relative flex items-center justify-center w-28 h-28">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="absolute inset-3 rounded-full bg-primary/10 animate-ping [animation-delay:150ms]" />
          <div className="relative z-10 w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-spin [animation-duration:3s]" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              {i === 0 && coverImage ? (
                <img
                  src={coverImage}
                  alt="Generated illustration"
                  className="w-full h-full object-cover transition-opacity duration-500 opacity-100"
                />
              ) : (
                <div className="w-full h-full animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
              )}
              {i === 0 && !coverImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary animate-spin [animation-duration:2s]" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 min-h-[28px]">
          {phase === "painting" && <Palette className="w-5 h-5 text-primary" />}
          <p className="text-lg font-semibold text-gray-800">
            {messages[messageIndex]}
          </p>
        </div>
        <p className="text-sm text-gray-400">Usually 8–15 seconds</p>
        {phase === "writing" && (
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>

      <div className="w-full max-w-xs space-y-2">
        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          Step {phase === "writing" ? "1" : "2"} of 2
        </p>
      </div>
    </div>
  );
};
