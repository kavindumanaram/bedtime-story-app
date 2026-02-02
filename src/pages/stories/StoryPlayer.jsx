import React from 'react';
import MainCard from '../../components/MainCard';
import { useParams, useNavigate } from 'react-router-dom';
import { stories } from '../../data/stories';

const StoryPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const story = stories.find((s) => s.id === Number(id));

  if (!story) return <MainCard>Story not found.</MainCard>;

  return (
    <MainCard style={{ maxWidth: 600, margin: '32px auto', padding: 32 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Back
      </button>
      {/* Use the innerImage for the story reader; fall back to cover if not provided */}
      <img
        src={story.innerImage || story.cover}
        alt={story.title}
        style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 8 }}
      />
      <h2 style={{ margin: '24px 0 8px' }}>{story.title}</h2>
      <p style={{ color: '#888', margin: 0 }}>by {story.author}</p>
      <div style={{ marginTop: 24 }}>
        {story.content.map((para, idx) => (
          <p key={idx} style={{ fontSize: 18, lineHeight: 1.7 }}>
            {para}
          </p>
        ))}
      </div>
    </MainCard>
  );
};

export default StoryPlayer;
