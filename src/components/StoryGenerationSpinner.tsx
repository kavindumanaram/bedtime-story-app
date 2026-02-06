import { useState, useEffect } from "react";

type Props = {
  totalImages: number;
  completedImages?: number;
  nightMode?: boolean;
};

export default function StoryGenerationSpinner({
  totalImages,
  completedImages = 0,
  nightMode = false,
}: Props) {
  const [animatedCount, setAnimatedCount] = useState(0);

  // Animate the counter up to completedImages
  useEffect(() => {
    if (animatedCount < completedImages) {
      const timer = setTimeout(() => setAnimatedCount(animatedCount + 1), 300);
      return () => clearTimeout(timer);
    }
  }, [animatedCount, completedImages]);

  const paragraphs = Array.from({ length: totalImages }, (_, i) => ({
    index: i,
    completed: i < animatedCount,
  }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div
        className={`
          rounded-2xl p-12 shadow-2xl max-w-md w-full mx-4
          ${nightMode ? "bg-gray-800" : "bg-white"}
        `}
      >
        {/* Header */}
        <h2
          className={`text-2xl font-bold mb-2 text-center ${
            nightMode ? "text-white" : "text-gray-900"
          }`}
        >
          ✨ Creating Story Characters
        </h2>
        <p
          className={`text-center text-sm mb-8 ${
            nightMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Bringing your story to life...
        </p>

        {/* Progress Items */}
        <div className="space-y-4">
          {paragraphs.map((para) => (
            <div
              key={para.index}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                ${
                  para.completed
                    ? nightMode
                      ? "bg-green-900/30"
                      : "bg-green-50"
                    : nightMode
                      ? "bg-gray-700/50"
                      : "bg-gray-100"
                }
              `}
            >
              {/* Icon/Indicator */}
              <div className="flex-shrink-0 w-10 h-10 relative flex items-center justify-center">
                {para.completed ? (
                  <div className="text-green-500">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 animate-spin" />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    nightMode
                      ? para.completed
                        ? "text-green-400"
                        : "text-gray-300"
                      : para.completed
                        ? "text-green-700"
                        : "text-gray-700"
                  }`}
                >
                  {para.completed ? "Character Created" : "Creating Character"}
                </p>
                <p
                  className={`text-xs ${
                    nightMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Scene {para.index + 1}
                </p>
              </div>

              {/* Status Badge */}
              {para.completed && (
                <div className="flex-shrink-0 text-xs font-bold text-green-600">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <p
              className={`text-xs font-medium ${
                nightMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Overall Progress
            </p>
            <p
              className={`text-xs font-bold ${
                nightMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {animatedCount}/{totalImages}
            </p>
          </div>
          <div
            className={`w-full h-2 rounded-full overflow-hidden ${
              nightMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
              style={{
                width: `${(animatedCount / totalImages) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Completion Message */}
        {animatedCount === totalImages && (
          <div className="mt-6 text-center animate-pulse">
            <p
              className={`text-sm font-medium ${
                nightMode ? "text-green-400" : "text-green-600"
              }`}
            >
              🎉 All characters ready! Loading your story...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
