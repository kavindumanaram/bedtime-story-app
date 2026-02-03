import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import LargeStoryPlayer from "../components/LargeStoryPlayer";
import { stories } from "../data/mock";
import { Moon, Sparkles, Wand2, MapPin } from "lucide-react";

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const story = stories.find((s) => s.id === id) || stories[0];
  const [nightMode, setNightMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
              `https://picsum.photos/seed/${story.id}-a/1200/800`,
              `https://picsum.photos/seed/${story.id}-b/1200/800`,
              `https://picsum.photos/seed/${story.id}-c/1200/800`,
            ]}
            subtitles={story.text.slice(0, 3)}
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
                {story.title}
              </h2>
              <p
                className={`text-sm ${nightMode ? "text-gray-400" : "text-gray-600"}`}
              >
                {story.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={getBadgeVariant(story.status)}>
                {story.status}
              </Badge>
              <Badge>{story.category}</Badge>
              <Badge>Ages {story.ageRange}</Badge>
              <Badge>{story.duration}</Badge>
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
              {story.text.map((paragraph, index) => (
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
