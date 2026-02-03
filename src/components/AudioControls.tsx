import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Card } from './Card';

interface AudioControlsProps {
  duration: string;
}

export const AudioControls: React.FC<AudioControlsProps> = ({ duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState('warm-mum');

  const voices = [
    { id: 'warm-mum', label: 'Warm Mum Voice' },
    { id: 'calm-dad', label: 'Calm Dad Voice' },
    { id: 'soft-storyteller', label: 'Soft Storyteller' },
    { id: 'gentle-grandma', label: 'Gentle Grandma' }
  ];

  const speeds = [0.8, 1, 1.2, 1.5];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Player</h3>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-500">{Math.floor(progress / 60)}:{String(progress % 60).padStart(2, '0')}</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(progress / 180) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-500">{duration}</span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors">
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-14 h-14 flex items-center justify-center bg-primary hover:bg-primary-dark text-white rounded-full transition-colors"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors">
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Speed and Voice controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Speed
          </label>
          <div className="flex gap-2">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`
                  flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${speed === s 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice
          </label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
};
