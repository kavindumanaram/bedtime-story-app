import React from 'react';
import { StoryTable } from '../components/StoryTable';
import { stories, downloadedStories } from '../data/mock';

export const Library: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Story Library</h1>
        <p className="text-gray-600">Browse and play from our collection of bedtime stories</p>
      </div>

      <StoryTable stories={stories} title="All Stories" />
      
      <StoryTable stories={downloadedStories} title="Downloaded Stories" />
    </div>
  );
};
