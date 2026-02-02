import React, { useEffect, useState } from 'react';
import { getStories } from '../../api/storiesApi';
import { Story } from '../../data/storyData';
import StoryCard from '../../components/cards/StoryCard';
import MainCard from '../../components/MainCard';
import { useNavigate } from 'react-router-dom';

const StoriesList: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getStories()
      .then(setStories)
      .catch(() => setError('Failed to load stories.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainCard style={{ maxWidth: 1100, margin: '32px auto', padding: 24 }}>
      <h1 style={{ textAlign: 'center', fontSize: 32, marginBottom: 32 }}>Bedtime Stories</h1>
      {loading && <div style={{ textAlign: 'center', padding: 40 }}>Loading stories...</div>}
      {error && <div style={{ color: 'red', textAlign: 'center', padding: 40 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {stories.map((story) => (
          <div
            key={story.id}
            onClick={() => navigate(`/stories/${story.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 12,
              borderRadius: 8,
              cursor: 'pointer',
              background: '#fff',
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)'
            }}
          >
            <img src={story.coverImageUrl} alt={story.title} style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{story.title}</h3>
              <p style={{ margin: '6px 0 0', color: '#666' }}>{story.shortDescription}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/stories/${story.id}`);
              }}
              style={{
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer'
              }}
            >
              Read
            </button>
          </div>
        ))}
      </div>
    </MainCard>
  );
};

export default StoriesList;
