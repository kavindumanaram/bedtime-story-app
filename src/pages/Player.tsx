import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { AudioControls } from '../components/AudioControls';
import { stories } from '../data/mock';
import { Moon, Sparkles, Wand2, MapPin } from 'lucide-react';

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const story = stories.find(s => s.id === id) || stories[0];
  const [nightMode, setNightMode] = useState(false);

  const prompts = [
    { text: 'Make it calmer', icon: Moon },
    { text: 'Shorten the story', icon: Sparkles },
    { text: 'Add a dragon', icon: Wand2 },
    { text: 'More Sri Lankan setting', icon: MapPin }
  ];

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'NEW': return 'new';
      case 'POPULAR': return 'popular';
      case 'DOWNLOADED': return 'downloaded';
      default: return 'default';
    }
  };

  return (
    <div className={`space-y-6 ${nightMode ? 'bg-gray-900' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${nightMode ? 'text-white' : 'text-gray-900'}`}>
            Story Player
          </h1>
          <p className={nightMode ? 'text-gray-400' : 'text-gray-600'}>
            Immerse yourself in tonight's bedtime adventure
          </p>
        </div>
        <button
          onClick={() => setNightMode(!nightMode)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${nightMode 
              ? 'bg-gray-800 text-white hover:bg-gray-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <Moon className="w-4 h-4 inline mr-2" />
          {nightMode ? 'Day Mode' : 'Night Mode'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Story Info */}
        <Card className={`p-6 ${nightMode ? 'bg-gray-800' : ''}`}>
          <img
            src={story.coverUrl}
            alt={story.title}
            className="w-full h-80 object-cover rounded-lg mb-6"
          />
          <div className="space-y-4">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${nightMode ? 'text-white' : 'text-gray-900'}`}>
                {story.title}
              </h2>
              <p className={`text-sm ${nightMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
        <Card className={`p-6 ${nightMode ? 'bg-gray-800' : ''}`}>
          <h3 className={`text-lg font-semibold mb-4 ${nightMode ? 'text-white' : 'text-gray-900'}`}>
            Story Text
          </h3>
          <div className={`
            space-y-4 max-h-80 overflow-y-auto pr-2
            ${nightMode ? 'text-gray-300' : 'text-gray-700'}
          `}>
            {story.text.map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </Card>
      </div>

      {/* Audio Controls */}
      <div className={nightMode ? 'bg-gray-800 rounded-xl' : ''}>
        <AudioControls duration={story.duration} />
      </div>

      {/* Suggested Prompts */}
      <Card className={`p-6 ${nightMode ? 'bg-gray-800' : ''}`}>
        <h3 className={`text-lg font-semibold mb-4 ${nightMode ? 'text-white' : 'text-gray-900'}`}>
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
                  ${nightMode 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {prompt.text}
              </button>
            );
          })}
        </div>
        <p className={`text-xs mt-3 ${nightMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Click any prompt to customize the story experience (UI demo)
        </p>
      </Card>
    </div>
  );
};
