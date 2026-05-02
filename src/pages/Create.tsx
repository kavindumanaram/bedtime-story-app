import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Moon,
  Scissors,
  Wand2,
  MapPin,
  CheckCircle2,
  Play,
  Palette,
} from "lucide-react";
import { generateStory, generateCoverImage } from "../api/openaiApi";
import { saveStory, type GeneratedStory } from "../api/storyDb";

type CreateState = "idle" | "writing" | "painting" | "done";

const quickPrompts = [
  { label: "Make it calmer", icon: Moon, theme: "calm and soothing" },
  { label: "Shorter story", icon: Scissors, theme: "very short and simple" },
  { label: "Add a dragon", icon: Wand2, suffix: " with a friendly dragon" },
  { label: "Sri Lankan setting", icon: MapPin, theme: "set in Sri Lanka" },
];

function WritingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      {/* Pulsing ring + spinning icon */}
      <div className="relative flex items-center justify-center w-28 h-28">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="absolute inset-3 rounded-full bg-primary/10 animate-ping [animation-delay:150ms]" />
        <div className="relative z-10 w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary animate-spin [animation-duration:3s]" />
        </div>
      </div>

      <div className="text-center space-y-3">
        <p className="text-lg font-semibold text-gray-800">Writing your story...</p>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
      </div>

      <StepProgress step={1} />
    </div>
  );
}

function PaintingSpinner({ coverImage }: { coverImage: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-8 w-full">
      <div className="flex items-center gap-3">
        <Palette className="w-5 h-5 text-primary" />
        <p className="text-lg font-semibold text-gray-800">Painting your illustrations...</p>
      </div>

      {/* 4-slot image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
          >
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

      <StepProgress step={2} />
    </div>
  );
}

function StepProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="w-full max-w-xs space-y-2">
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: step === 1 ? "40%" : "90%" }}
        />
      </div>
      <p className="text-xs text-gray-400 text-center">Step {step} of 2</p>
    </div>
  );
}

function DoneCard({
  title,
  onPlay,
}: {
  title: string;
  onPlay: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
        <CheckCircle2 className="w-12 h-12 text-primary" />
      </div>

      <div className="space-y-1">
        <p className="text-xl font-bold text-gray-900">"{title}" is ready!</p>
        <p className="text-sm text-gray-500">Redirecting to your story...</p>
      </div>

      <button
        onClick={onPlay}
        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors shadow-sm"
      >
        <Play className="w-4 h-4" />
        Play Story Now
      </button>
    </div>
  );
}

export const Create: React.FC = () => {
  const navigate = useNavigate();

  const [createState, setCreateState] = useState<CreateState>("idle");
  const [childName, setChildName] = useState("Dimuth");
  const [childAge, setChildAge] = useState(6);
  const [theme, setTheme] = useState("friendly dragon");
  const [error, setError] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [createdStory, setCreatedStory] = useState<GeneratedStory | null>(null);

  // Auto-redirect after done
  useEffect(() => {
    if (createState === "done" && createdStory) {
      const timer = setTimeout(() => navigate(`/player/${createdStory.id}`), 1800);
      return () => clearTimeout(timer);
    }
  }, [createState, createdStory, navigate]);

  const handleGenerate = async () => {
    setError(null);
    setCoverImage(null);
    setCreatedStory(null);

    try {
      setCreateState("writing");
      const story = await generateStory(childName, childAge, theme);

      setCreateState("painting");
      const image = await generateCoverImage(story.title, story.summary);
      setCoverImage(image);

      const saved: GeneratedStory = {
        id: String(Date.now()),
        title: story.title,
        summary: story.summary,
        text: story.text,
        coverImage: image,
        images: [image],
        childName,
        age: childAge,
        theme,
        createdAt: new Date().toISOString(),
      };
      await saveStory(saved);
      setCreatedStory(saved);
      setCreateState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setCreateState("idle");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create a Story</h1>
        <p className="text-gray-500 text-sm">Generate a personalised bedtime adventure for your child</p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">

        {createState === "idle" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                New Bedtime Story
              </h2>
              <p className="text-sm text-gray-500">Personalise the story for your child</p>
            </div>

            {/* Form inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Child's Name</span>
                <input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Dimuth"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Age</span>
                <input
                  type="number"
                  value={childAge}
                  onChange={(e) => setChildAge(Number(e.target.value))}
                  min={1}
                  max={12}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Theme</span>
                <input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. friendly dragon"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </label>
            </div>

            {/* Quick prompt chips */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick themes</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={chip.label}
                      onClick={() =>
                        setTheme(chip.theme ?? `${theme}${chip.suffix ?? ""}`)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-primary/5 hover:border-primary/30 text-gray-600 hover:text-primary text-sm transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-base transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate Story
            </button>
          </div>
        )}

        {createState === "writing" && <WritingSpinner />}

        {createState === "painting" && <PaintingSpinner coverImage={coverImage} />}

        {createState === "done" && createdStory && (
          <DoneCard
            title={createdStory.title}
            onPlay={() => navigate(`/player/${createdStory.id}`)}
          />
        )}
      </div>
    </div>
  );
};
