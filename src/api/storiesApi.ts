import { Story, mockStories } from '../data/storyData';

export function getStories(): Promise<Story[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockStories), 500);
  });
}

export function getStoryById(id: string): Promise<Story | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockStories.find((s) => s.id === id)), 500);
  });
}
