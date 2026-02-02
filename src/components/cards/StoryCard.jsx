import React from 'react';
import MainCard from '../MainCard';

const StoryCard = ({ story, onClick }) => (
  <MainCard style={{ cursor: 'pointer', maxWidth: 320 }} onClick={onClick}>
    {/* Use titleImage if provided, otherwise fall back to cover */}
    <img
      src={story.titleImage || story.cover}
      alt={story.title}
      style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }}
    />
    <h3 style={{ margin: '16px 0 8px' }}>{story.title}</h3>
    <p style={{ color: '#888', margin: 0 }}>by {story.author}</p>
    <p style={{ margin: '8px 0 0' }}>{story.summary}</p>
  </MainCard>
);

export default StoryCard;
