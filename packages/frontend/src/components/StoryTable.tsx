import React from 'react';
import { Play } from 'lucide-react';
import { Story } from '../data/mock';
import { Badge } from './Badge';
import { useNavigate } from 'react-router-dom';

interface StoryTableProps {
  stories: Story[];
  title: string;
}

export const StoryTable: React.FC<StoryTableProps> = ({ stories, title }) => {
  const navigate = useNavigate();

  const getBadgeVariant = (status: Story['status']) => {
    switch (status) {
      case 'NEW': return 'new';
      case 'POPULAR': return 'popular';
      case 'DOWNLOADED': return 'downloaded';
      default: return 'default';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Story
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stories.map((story) => (
              <tr key={story.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="w-12 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{story.title}</div>
                      <div className="text-xs text-gray-500">{story.summary.slice(0, 50)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {story.ageRange}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {story.duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {story.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getBadgeVariant(story.status)}>
                    {story.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => navigate(`/player/${story.id}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Play
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
