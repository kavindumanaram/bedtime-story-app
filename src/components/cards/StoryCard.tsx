import React from 'react';
import { Story } from '../../data/storyData';
import MainCard from '../MainCard';

interface StoryCardProps {
  story: Story;
  onPlay: () => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onPlay }) => (
  <MainCard style={{ maxWidth: 320, width: '100%', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
    <div style={{ position: 'relative' }}>
      <img
        src={story.coverImageUrl}
        alt={story.title}
        style={{ width: '100%', height: 180, objectFit: 'cover', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
      />
      <span
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: 'rgba(255,255,255,0.8)',
          borderRadius: 12,
          padding: '2px 10px',
          fontSize: 12,
          fontWeight: 600
        }}
      >
        {story.ageGroup} yrs
      </span>
    </div>
    <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{story.title}</h3>
      <p style={{ color: '#888', fontSize: 14, margin: 0 }}>{story.shortDescription}</p>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#666' }}>⏱ {story.durationMin} min</span>
        <button
          onClick={onPlay}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 16px',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer'
          }}
        >
          Play / Read
        </button>
      </div>
    </div>
  </MainCard>
);

export default StoryCard;
