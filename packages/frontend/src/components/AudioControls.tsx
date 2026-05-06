import React from "react";
import { Play, Pause, Loader2 } from "lucide-react";

export type VoiceProfile = {
  id: string;
  label: string;
  keywords: string[];
};

export const VOICE_PROFILES: VoiceProfile[] = [
  { id: "gentle-grandma",     label: "Gentle Grandma",     keywords: ["zira", "female", "samantha", "karen", "moira", "tessa", "fiona", "victoria"] },
  { id: "warm-mother",        label: "Warm Mother",         keywords: ["female", "zira", "samantha", "karen", "moira"] },
  { id: "calm-father",        label: "Calm Father",         keywords: ["david", "mark", "daniel", "alex", "james", "male"] },
  { id: "soft-narrator",      label: "Soft Narrator",       keywords: [] },
  { id: "sleepy-storyteller", label: "Sleepy Storyteller",  keywords: [] },
];

const SPEEDS = [
  { value: 0.8, label: "Slow" },
  { value: 1.0, label: "Normal" },
  { value: 1.2, label: "Fast" },
  { value: 1.5, label: "Faster" },
];

interface AudioControlsProps {
  duration: string;
  isPlaying: boolean;
  isLoading?: boolean;
  hasVoices: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (speed: number) => void;
  onVoiceChange: (voiceId: string) => void;
  progress: number;
  currentSpeed: number;
  currentVoice: string;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  duration,
  isPlaying,
  isLoading = false,
  hasVoices,
  onPlay,
  onPause,
  onSpeedChange,
  onVoiceChange,
  progress,
  currentSpeed,
  currentVoice,
}) => {
  const isBusy = isLoading || isPlaying;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      {/* Play row: button + progress */}
      <div className="flex items-center gap-4">
        <button
          onClick={isBusy ? onPause : onPlay}
          aria-label={isPlaying ? "Pause narration" : "Play narration"}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0 transition-all duration-200 bg-primary hover:bg-primary-dark ${
            isBusy ? "scale-105 shadow-lg" : ""
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span className="truncate">
              {isLoading ? "Starting…" : isPlaying ? "Reading aloud…" : "Tap to listen"}
            </span>
            <span className="flex-shrink-0 ml-2">{duration}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isBusy ? "bg-primary" : "bg-gray-300"
              }`}
              style={{ width: `${isPlaying ? progress : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Speed selector */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Speed</p>
        <div className="flex gap-2">
          {SPEEDS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onSpeedChange(value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                currentSpeed === value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice / narrator selector */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Narrator</p>
        {hasVoices ? (
          <div className="flex flex-wrap gap-1.5">
            {VOICE_PROFILES.map((v) => (
              <button
                key={v.id}
                onClick={() => onVoiceChange(v.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                  currentVoice === v.id
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            Voice narration isn't available in this browser. Try Chrome or Safari.
          </p>
        )}
      </div>
    </div>
  );
};
