import { useState } from "react";

export type StoryGenerationSettings = {
  imagesPerStory: number;
  progressiveGeneration: boolean;
  cinematicIntroEnabled: boolean;
  autoplayEnabled: boolean;
  imageGenerationTimeoutMs: number;
};

const STORAGE_KEY = "husht_dev_settings";

export const DEV_SETTINGS_DEFAULTS: StoryGenerationSettings = {
  imagesPerStory: 5,
  progressiveGeneration: true,
  cinematicIntroEnabled: true,
  autoplayEnabled: true,
  imageGenerationTimeoutMs: 30000,
};

export function getDevSettings(): StoryGenerationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEV_SETTINGS_DEFAULTS };
    return { ...DEV_SETTINGS_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEV_SETTINGS_DEFAULTS };
  }
}

export function saveDevSettings(settings: StoryGenerationSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetDevSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function useDevSettings(): [StoryGenerationSettings, (next: Partial<StoryGenerationSettings>) => void] {
  const [settings, setSettings] = useState<StoryGenerationSettings>(getDevSettings);
  const update = (next: Partial<StoryGenerationSettings>) => {
    const merged = { ...settings, ...next };
    saveDevSettings(merged);
    setSettings(merged);
  };
  return [settings, update];
}
