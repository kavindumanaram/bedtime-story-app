import React from 'react';
import { Story } from '../data/storyData';

interface StoryCoverHeroProps {
  story: Story;
  onStartReading?: () => void;
  onPlayVoice?: () => void;
}

const StoryCoverHero: React.FC<StoryCoverHeroProps> = ({ story, onStartReading, onPlayVoice }) => {
  return (
    <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ position: 'relative', width: '100%', height: 320, background: '#f5f6f8' }}>
        <img src={story.coverImageUrl} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div
          style={{
            position: 'absolute',
            left: 20,
            bottom: 20,
            color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            maxWidth: '72%'
          }}
        >
          <h1 style={{ margin: 0, fontSize: 28 }}>{story.title}</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.95 }}>{story.shortDescription}</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button
              onClick={() => onStartReading && onStartReading()}
              style={{
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Start Reading
            </button>
            <button
              onClick={() => onPlayVoice && onPlayVoice()}
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Play Voice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryCoverHero;
