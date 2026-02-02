import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoryById } from '../../api/storiesApi';
import { Story } from '../../data/storyData';
import StoryReader from '../../components/StoryReader';
import MainCard from '../../components/MainCard';

const StoryPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getStoryById(id)
      .then((s) => {
        setStory(s || null);
        setError(!s ? 'Story not found.' : null);
      })
      .catch(() => setError('Failed to load story.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <MainCard style={{ margin: '40px auto', maxWidth: 600 }}>Loading story...</MainCard>;
  if (error || !story) return <MainCard style={{ margin: '40px auto', maxWidth: 600 }}>{error || 'Story not found.'}</MainCard>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={() => navigate('/stories')}
          style={{
            background: 'rgba(25,118,210,0.08)',
            color: '#1976d2',
            border: 'none',
            borderRadius: 8,
            padding: '6px 16px',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            marginRight: 8
          }}
        >
          ← Back to Stories
        </button>
      </div>
      {/* Directly show the story book (no separate title page) */}
      <StoryReader paragraphs={story.paragraphs} pages={story.pages} />
    </div>
  );
};

export default StoryPlayer;
