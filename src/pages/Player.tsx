import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import LargeStoryPlayer from "../components/LargeStoryPlayer";
import { stories } from "../data/mock";
import { generateStory, generateCoverImage } from "../api/openaiApi";
import { saveStory, loadStory, type GeneratedStory } from "../api/storyDb";
import { Moon, Sparkles, Wand2, MapPin } from "lucide-react";

type LoadingStep = "story" | "image" | null;

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const mockStory = stories.find((s) => s.id === id) || stories[0];

  const [currentStory, setCurrentStory] = useState(mockStory);
  const [nightMode, setNightMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [error, setError] = useState<string | null>(null);

  const [childName, setChildName] = useState("Dimuth");
  const [childAge, setChildAge] = useState(6);
  const [theme, setTheme] = useState("friendly dragon");

  const prompts = [
    { text: "Make it calmer", icon: Moon },
    { text: "Shorten the story", icon: Sparkles },
    { text: "Add a dragon", icon: Wand2 },
    { text: "More Sri Lankan setting", icon: MapPin },
  ];

  useEffect(() => {
    loadStory(mockStory.id).then((saved) => {
      if (saved) {
        setCurrentStory({
          ...mockStory,
          title: saved.title,
          summary: saved.summary,
          text: saved.text,
          pages: [saved.coverImage],
        });
      }
    });
  }, [mockStory.id]);

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "NEW": return "new";
      case "POPULAR": return "popular";
      case "DOWNLOADED": return "downloaded";
      default: return "default";
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      setLoadingStep("story");
      const storyContent = await generateStory(childName, childAge, theme);

      setLoadingStep("image");
      const coverImage = await generateCoverImage(storyContent.title, storyContent.summary);

      const generated: GeneratedStory = {
        id: mockStory.id,
        title: storyContent.title,
        summary: storyContent.summary,
        text: storyContent.text,
        coverImage,
        childName,
        age: childAge,
        theme,
        createdAt: new Date().toISOString(),
      };

      await saveStory(generated);
      setCurrentStory({ ...mockStory, ...generated, pages: [coverImage] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const stepLabel =
    loadingStep === "story"
      ? "Writing your story..."
      : loadingStep === "image"
        ? "Drawing the cover..."
        : null;

  return (
    <div className={`space-y-6 ${nightMode ? "bg-gray-900" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${nightMode ? "text-white" : "text-gray-900"}`}>
            Story Player
          </h1>
          <p className={nightMode ? "text-gray-400" : "text-gray-600"}>
            Immerse yourself in tonight's bedtime adventure
          </p>
        </div>
        <button
          onClick={() => setNightMode(!nightMode)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            nightMode
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Moon className="w-4 h-4 inline mr-2" />
          {nightMode ? "Day Mode" : "Night Mode"}
        </button>
      </div>

      <div className={`grid grid-cols-1 ${showDetails ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-6`}>
        <Card className={`p-6 ${nightMode ? "bg-gray-800" : ""}`}>
          <LargeStoryPlayer
            pages={currentStory.pages?.length ? currentStory.pages : undefined}
            subtitles={(() => {
              if (!currentStory.text?.length) return [];
              const n = currentStory.text.length;
              const mid = Math.ceil(n / 3);
              return [
                currentStory.text[0] || "",
                currentStory.text[Math.min(mid, n - 1)] || "",
                currentStory.text[n - 1] || "",
              ];
            })()}
            initialIndex={0}
            onToggleDetails={() => setShowDetails((s) => !s)}
            detailsOpen={showDetails}
            storyId={currentStory.id}
          />

          <div className="mt-6 space-y-4">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${nightMode ? "text-white" : "text-gray-900"}`}>
                {currentStory.title}
              </h2>
              <p className={`text-sm ${nightMode ? "text-gray-400" : "text-gray-600"}`}>
                {currentStory.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getBadgeVariant(mockStory.status)}>{mockStory.status}</Badge>
              <Badge>{mockStory.category}</Badge>
              <Badge>Ages {mockStory.ageRange}</Badge>
              <Badge>{mockStory.duration}</Badge>
            </div>
          </div>
        </Card>

        {showDetails && (
          <Card className={`p-6 ${nightMode ? "bg-gray-800" : ""}`}>
            <h3 className={`text-lg font-semibold mb-4 ${nightMode ? "text-white" : "text-gray-900"}`}>
              Story Text
            </h3>
            <div className={`space-y-4 max-h-80 overflow-y-auto pr-2 ${nightMode ? "text-gray-300" : "text-gray-700"}`}>
              {(currentStory.text || []).map((paragraph, index) => (
                <p key={index} className="leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Generate Story */}
      <Card className={`p-6 ${nightMode ? "bg-gray-800" : ""}`}>
        <h3 className={`text-lg font-semibold mb-4 ${nightMode ? "text-white" : "text-gray-900"}`}>
          Generate a Story
        </h3>

        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            className="px-3 py-2 rounded border text-gray-900"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Child's name"
            disabled={loading}
          />
          <input
            type="number"
            className="px-3 py-2 rounded border w-24 text-gray-900"
            value={childAge}
            onChange={(e) => setChildAge(Number(e.target.value))}
            disabled={loading}
          />
          <input
            className="px-3 py-2 rounded border flex-1 text-gray-900"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Theme (e.g. friendly dragon)"
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium min-w-[140px] ${
              loading ? "bg-blue-400 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {stepLabel ?? "Generate Story"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        <div className="flex flex-wrap gap-3">
          {prompts.map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <button
                key={index}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  nightMode
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {prompt.text}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
