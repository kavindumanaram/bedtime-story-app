import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import LargeStoryPlayer from "../components/LargeStoryPlayer";
import { stories } from "../data/mock";
import { generateStory } from "../api/generateStoryApi";
import {
  generateImage,
  waitForImageGeneration,
} from "../api/imageGenerationApi";
import StoryGenerationSpinner from "../components/StoryGenerationSpinner";
import { Moon, Sparkles, Wand2, MapPin } from "lucide-react";

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const story = stories.find((s) => s.id === id) || stories[0];
  const [currentStory, setCurrentStory] = useState(story);
  const [nightMode, setNightMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // generation inputs
  const [childName, setChildName] = useState("Dimuth");
  const [childAge, setChildAge] = useState<number>(6);
  const [theme, setTheme] = useState("friendly Chinese dragon");
  const [genLoading, setGenLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStory, setPendingStory] = useState<any>(null);
  const [imgGenLoading, setImgGenLoading] = useState(false);
  const [completedImagesCount, setCompletedImagesCount] = useState(0);

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
        newStory.text = (res as string)
          .split("\n\n")
          .map((p: string) => p.trim())
          .filter(Boolean) as string[];
        newStory.title = `A Story for ${childName}`;
        newStory.summary = newStory.text[0] || "";
      } else if (typeof res === "object") {
        // Handle new API format with paragraphs array
        if (Array.isArray(res.paragraphs) && res.paragraphs.length > 0) {
          newStory.text = res.paragraphs
            .sort((a: any, b: any) => (a.paragraphIndex || 0) - (b.paragraphIndex || 0))
            .map((p: any) => p.text || "");
          newStory.id = res.storyId;
          newStory.title = res.title || `A Story for ${childName}`;
          newStory.summary = newStory.text[0] || "";
        } else if (Array.isArray(res.text)) {
          newStory.text = res.text;
        } else if (typeof res.text === "string") {
          newStory.text = (res.text as string)
            .split("\n\n")
            .map((p: string) => p.trim())
            .filter(Boolean) as string[];
        } else if (typeof res.story === "string") {
          newStory.text = (res.story as string)
            .split("\n\n")
            .map((p: string) => p.trim())
            .filter(Boolean) as string[];
        } else if (res.body) {
          if (typeof res.body === "string") {
            try {
              const parsed = JSON.parse(res.body);
              if (Array.isArray(parsed.text)) newStory.text = parsed.text;
              else if (typeof parsed.text === "string")
                newStory.text = (parsed.text as string)
                  .split("\n\n")
                  .map((p: string) => p.trim())
                  .filter(Boolean) as string[];
            } catch {
              newStory.text = [String(res.body)];
            }
          } else if (
            typeof res.body === "object" &&
            Array.isArray(res.body.text)
          ) {
            newStory.text = res.body.text;
          }
        } else {
          newStory.text = [JSON.stringify(res)];
        }

        newStory.title = newStory.title || `A Story for ${childName}`;
        newStory.summary =
          newStory.summary || (newStory.text && newStory.text[0]) || "";
      }

      setCurrentStory(newStory);
      setPendingStory(newStory);
      setShowConfirmDialog(true);
    } catch (e) {
      console.error(e);
      alert("Failed to generate story (see console)");
    } finally {
      setGenLoading(false);
    }
  };

  const handleConfirmAndGenerateImages = async () => {
    if (!pendingStory) return;

    setImgGenLoading(true);
    setShowConfirmDialog(false);
    setCompletedImagesCount(0);

    try {
      // Generate images for all paragraphs
      const storyId = pendingStory.id || `story-${Date.now()}`;
      const allParagraphs = (pendingStory.text || [])
        .map((p: string) => (p || "").trim())
        .filter((p: string) => p.length > 0);
      
      // Generate for all paragraphs
      const indicesToGenerate = allParagraphs.map((_, i) => i);
      console.log(`Total paragraphs: ${allParagraphs.length}, Generating images for all ${indicesToGenerate.length} paragraphs`);
      const pages: string[] = new Array(allParagraphs.length);
      const requestIds: Array<{ requestId: string; paragraphIndex: number }> =
        [];

      // Step 1: Send requests for indices 0 and 2
      for (let idx = 0; idx < indicesToGenerate.length; idx++) {
        const i = indicesToGenerate[idx];
        try {
          const response = await generateImage({
            paragraph: allParagraphs[i],
            storyId,
            paragraphIndex: i,
          });
          requestIds.push({ requestId: response.requestId, paragraphIndex: i });
          console.log(`Image gen started for para ${i}: ${response.requestId}`);
        } catch (e) {
          console.error(`Failed to start image gen for para ${i}:`, e);
        }
      }

      // Step 2: Poll status for all requests (check every 3 seconds).
      // Attach a `.then` to each poll promise so we log the response as soon as
      // an image becomes complete.
      const promises = requestIds.map((req) =>
        waitForImageGeneration(req.requestId, 60, 30000).then((res) => {
          console.log("Image generation complete:", res);
          if (res.image?.url) {
            console.log(`✓ Paragraph ${res.paragraphIndex}: ${res.image.url}`);
          }
          // Increment completed count
          setCompletedImagesCount((prev) => prev + 1);
          return res;
        }),
      );

      const results = await Promise.allSettled(promises);

      // Step 3: Extract image URLs in order
      const imageMap: { [key: number]: string } = {};
      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value.image?.url) {
          const pIdx = requestIds[idx].paragraphIndex;
          imageMap[pIdx] = result.value.image.url;
          console.log(
            `→ Assigned to paragraph ${pIdx}: ${result.value.image.url}`,
          );
        }
      });

      // Build pages array in order - use black background for missing images
      const BLACK_BG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Crect fill='%23000000' width='1200' height='800'/%3E%3C/svg%3E";
      for (let i = 0; i < allParagraphs.length; i++) {
        pages[i] = imageMap[i] || BLACK_BG;
      }

      // Step 4: Save to localStorage and update story
      const storageKey = `story-images-${storyId}`;
      console.log(`Final pages array: ${JSON.stringify(pages.map((p, i) => `[${i}]: ${p.substring(0, 50)}...`))}`);
      localStorage.setItem(storageKey, JSON.stringify(pages));

      pendingStory.pages = pages;
      pendingStory.id = storyId;
      setCurrentStory(pendingStory);
      setPendingStory(null);
    } catch (e) {
      console.error("Image generation error:", e);
      alert("Image generation failed. Using default images.");
      setCurrentStory(pendingStory);
      setPendingStory(null);
    } finally {
      setImgGenLoading(false);
    }
  };

  const handleRejectStory = () => {
    setShowConfirmDialog(false);
    setPendingStory(null);
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
            pages={
              currentStory.pages && currentStory.pages.length
                ? currentStory.pages
                : undefined
            }
            subtitles={(() => {
              if (!currentStory.text || currentStory.text.length === 0) return [];
              const totalParagraphs = currentStory.text.length;
              const partSize = Math.ceil(totalParagraphs / 3);
              return [
                currentStory.text[0] || "",
                currentStory.text[Math.min(partSize, totalParagraphs - 1)] || "",
                currentStory.text[totalParagraphs - 1] || "",
              ];
            })()}
            initialIndex={0}
            onToggleDetails={() => setShowDetails((s) => !s)}
            detailsOpen={showDetails}
            storyId={currentStory.id}
          />

          <div className="mt-6 space-y-4">
            <div>
              <h2
                className={`text-2xl font-bold mb-2 ${nightMode ? "text-white" : "text-gray-900"}`}
              >
                {currentStory.title || story.title}
              </h2>
              <p
                className={`text-sm ${nightMode ? "text-gray-400" : "text-gray-600"}`}
              >
                {currentStory.summary || story.summary}
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
              {(currentStory.text || story.text).map((paragraph, index) => (
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
              className={`px-4 py-2 rounded-lg font-medium ${genLoading ? "bg-gray-400 text-white" : "bg-blue-600 text-white"}`}
            >
              {genLoading ? "Generating..." : "Generate"}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingStory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card
            className={`w-full max-w-2xl p-8 ${nightMode ? "bg-gray-800" : "bg-white"}`}
          >
            <h2
              className={`text-2xl font-bold mb-4 ${nightMode ? "text-white" : "text-gray-900"}`}
            >
              Review Your Story
            </h2>
            <div
              className={`space-y-4 max-h-96 overflow-y-auto mb-6 ${nightMode ? "text-gray-300" : "text-gray-700"}`}
            >
              <div>
                <h3
                  className={`text-lg font-semibold ${nightMode ? "text-white" : ""}`}
                >
                  {pendingStory.title}
                </h3>
                <p className="text-sm mt-1">{pendingStory.summary}</p>
              </div>
              <div className="space-y-2">
                {(pendingStory.text || []).map((p: string, i: number) => (
                  <p key={i} className="text-sm leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRejectStory}
                className="px-6 py-2 rounded-lg font-medium bg-gray-400 text-white hover:bg-gray-500"
              >
                Edit Story
              </button>
              <button
                onClick={handleConfirmAndGenerateImages}
                disabled={imgGenLoading}
                className={`px-6 py-2 rounded-lg font-medium ${imgGenLoading ? "bg-blue-400 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                {imgGenLoading
                  ? "Generating Images..."
                  : "Confirm & Generate Images"}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Image Generation Spinner */}
      {imgGenLoading && (
        <StoryGenerationSpinner
          totalImages={pendingStory?.text?.length || 3}
          completedImages={completedImagesCount}
          nightMode={nightMode}
        />
      )}
    </div>
  );
};
