import React from 'react';
import StoryCard from '../../components/cards/StoryCard';
import { stories } from '../../data/stories';
import { useNavigate } from 'react-router-dom';
import MainCard from '../../components/MainCard';

const StoriesList = () => {
  const navigate = useNavigate();
  return (
    <MainCard style={{ maxWidth: 900, margin: '32px auto', padding: 32 }}>
      <h1>Bedtime Stories</h1>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} onClick={() => navigate(`/stories/${story.id}`)} />
        ))}
      </div>
    </MainCard>
  );
};

export default StoriesList;
