import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import LargeStoryPlayer from "../components/LargeStoryPlayer";
import { stories } from "../data/mock";
import { generateStory } from "../api/generateStoryApi";
import { Moon, Sparkles, Wand2, MapPin } from "lucide-react";

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const story = stories.find((s) => s.id === id) || stories[0];
  const [currentStory, setCurrentStory] = useState(story);
  const [nightMode, setNightMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Generation inputs
  const [childName, setChildName] = useState("Dimuth");
  const [childAge, setChildAge] = useState<number>(6);
  const [theme, setTheme] = useState("friendly Chinese dragon");
  const [genLoading, setGenLoading] = useState(false);

  const prompts = [
    { text: "Make it calmer", icon: Moon },
    { text: "Shorten the story", icon: Sparkles },
    { text: "Add a dragon", icon: Wand2 },
    { text: "More Sri Lankan setting", icon: MapPin },
  ];

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "NEW":
        return "new";
      case "POPULAR":
        return "popular";
      case "DOWNLOADED":
        return "downloaded";
      default:
        return "default";
    }
  };

  const handleGenerate = async () => {
    setGenLoading(true);
    try {
      const res: any = await generateStory({ childName, age: childAge, theme });
      const newStory: any = { ...currentStory };

      if (typeof res === "string") {
        newStory.text = (res as string).split("\n\n").map((p: string) => p.trim()).filter(Boolean) as string[];
        newStory.title = `A Story for ${childName}`;
        newStory.summary = newStory.text[0] || "";
      } else if (typeof res === "object") {
        if (Array.isArray(res.text)) {
          newStory.text = res.text;
        } else if (typeof res.text === "string") {
          newStory.text = (res.text as string).split("\n\n").map((p: string) => p.trim()).filter(Boolean) as string[];
        } else if (typeof res.story === "string") {
          newStory.text = (res.story as string).split("\n\n").map((p: string) => p.trim()).filter(Boolean) as string[];
        } else if (res.body) {
          if (typeof res.body === "string") {
            try {
              const parsed = JSON.parse(res.body);
              if (Array.isArray(parsed.text)) newStory.text = parsed.text;
              else if (typeof parsed.text === "string") newStory.text = (parsed.text as string).split("\n\n").map((p: string) => p.trim()).filter(Boolean) as string[];
            } catch {
              newStory.text = [String(res.body)];
            }
          } else if (typeof res.body === "object" && Array.isArray(res.body.text)) {
            newStory.text = res.body.text;
          }
        } else {
          newStory.text = [JSON.stringify(res)];
        }

        newStory.title = newStory.title || `A Story for ${childName}`;
        newStory.summary = newStory.summary || (newStory.text && newStory.text[0]) || "";
      }

      setCurrentStory(newStory);
      setShowDetails(true);
    } catch (e) {
      console.error(e);
      alert("Failed to generate story (see console)");
    } finally {
      setGenLoading(false);
    }
  }; 

  return (
    <div className={`space-y-6 ${nightMode ? "bg-gray-900" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-2xl font-bold mb-2 ${nightMode ? "text-white" : "text-gray-900"}`}
          >
            Story Player
          </h1>
          <p className={nightMode ? "text-gray-400" : "text-gray-600"}>
            Immerse yourself in tonight's bedtime adventure
          </p>
        </div>
        <button
          onClick={() => setNightMode(!nightMode)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${
              nightMode
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }
          `}
        >
          <Moon className="w-4 h-4 inline mr-2" />
          {nightMode ? "Day Mode" : "Night Mode"}
        </button>
      </div>

      <div
        className={`grid grid-cols-1 ${showDetails ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-6`}
      >
        {/* Left: Large visual story player */}
        <Card className={`p-6 ${nightMode ? "bg-gray-800" : ""}`}>
          <LargeStoryPlayer
            pages={[
              `https://picsum.photos/seed/${currentStory.id || story.id}-a/1200/800`,
              `https://picsum.photos/seed/${currentStory.id || story.id}-b/1200/800`,
              `https://picsum.photos/seed/${currentStory.id || story.id}-c/1200/800`,
            ]}
            subtitles={currentStory.text.slice(0, 3)}
            autoAdvanceMs={4500}
            initialIndex={0}
            onToggleDetails={() => setShowDetails((s) => !s)}
            detailsOpen={showDetails}
          />

          <div className="mt-6 space-y-4">
            <div>
              <h2
                className={`text-2xl font-bold mb-2 ${nightMode ? "text-white" : "text-gray-900"}`}
              >
                {currentStory.title}
              </h2>
              <p
                className={`text-sm ${nightMode ? "text-gray-400" : "text-gray-600"}`}
              >
                {currentStory.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={getBadgeVariant(currentStory.status)}>
                {currentStory.status}
              </Badge>
              <Badge>{currentStory.category}</Badge>
              <Badge>Ages {currentStory.ageRange}</Badge>
              <Badge>{currentStory.duration}</Badge>
            </div>
          </div>
        </Card>

        {/* Right: Story Text */}
        {showDetails && (
          <Card className={`p-6 ${nightMode ? "bg-gray-800" : ""}`}>
            <h3
              className={`text-lg font-semibold mb-4 ${nightMode ? "text-white" : "text-gray-900"}`}
            >
              Story Text
            </h3>
            <div
              className={`
              space-y-4 max-h-80 overflow-y-auto pr-2
              ${nightMode ? "text-gray-300" : "text-gray-700"}
            `}
            >
              {currentStory.text.map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>
        )} 
      </div>

      {/* Suggested Prompts */}
      {showDetails && (
        <Card className={`p-6 ${nightMode ? "bg-gray-800" : ""}`}>
          <h3
            className={`text-lg font-semibold mb-4 ${nightMode ? "text-white" : "text-gray-900"}`}
          >
            Customize Your Story
          </h3>

          {/* Small generation form */}
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <input
              className="px-3 py-2 rounded border"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Child's name"
            />
            <input
              type="number"
              className="px-3 py-2 rounded border w-24"
              value={childAge}
              onChange={(e) => setChildAge(Number(e.target.value))}
            />
            <input
              className="px-3 py-2 rounded border flex-1"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Theme (e.g. friendly Chinese dragon)"
            />
            <button
              onClick={handleGenerate}
              disabled={genLoading}
              className={`px-4 py-2 rounded-lg font-medium ${genLoading ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white'}`}
            >
              {genLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {prompts.map((prompt, index) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={index}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium
                    transition-colors
                    ${
                      nightMode
                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {prompt.text}
                </button>
              );
            })}
          </div>
          <p
            className={`text-xs mt-3 ${nightMode ? "text-gray-500" : "text-gray-500"}`}
          >
            Click any prompt to customize the story experience (UI demo)
          </p>
        </Card>
      )}
    </div>
  );
};
