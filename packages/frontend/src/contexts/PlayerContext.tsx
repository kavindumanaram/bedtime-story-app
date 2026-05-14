import React, { createContext, useContext, useState } from 'react';
import type { SceneSlot, StoryContext } from '../api/sceneImageApi';

export type PlayerRouterState = {
  slots?: SceneSlot[];
  storyContext?: StoryContext;
  paragraphCount?: number;
  childName?: string;
  storyTitle?: string;
  theme?: string;
};

type PlayerEntry = { id: string; state?: PlayerRouterState };

type PlayerCtx = {
  playerEntry: PlayerEntry | null;
  openPlayer: (id: string, state?: PlayerRouterState) => void;
  closePlayer: () => void;
};

const PlayerContext = createContext<PlayerCtx>({
  playerEntry: null,
  openPlayer: () => {},
  closePlayer: () => {},
});

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerEntry, setPlayerEntry] = useState<PlayerEntry | null>(null);
  return (
    <PlayerContext.Provider value={{
      playerEntry,
      openPlayer: (id, state) => setPlayerEntry({ id, state }),
      closePlayer: () => setPlayerEntry(null),
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
