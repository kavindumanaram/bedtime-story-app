import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Player } from "./Player";

vi.mock("../api/storyDb", () => ({
  loadStory: vi.fn().mockResolvedValue(undefined),
  updateStoryImages: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ activeChild: null, profile: null }),
}));

vi.mock("../api/dailyStory", () => ({
  updateStreak: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../api/storyMemory", () => ({
  updateMemoryAfterRead: vi.fn().mockResolvedValue(undefined),
  saveFeedback: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../hooks/useProgressiveImages", () => ({
  useProgressiveImages: () => ({ images: [], allDone: false, readyCount: 0 }),
}));

vi.mock("../hooks/useAmbientAudio", () => ({
  useAmbientAudio: () => ({ isPlaying: false, toggle: vi.fn() }),
}));

vi.mock("../lib/api", () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}));

// Auto-dismiss the cinematic intro so it never blocks player content in tests
vi.mock("../components/CinematicIntro", () => ({
  CinematicIntro: ({ onDone }: { onDone: () => void }) => {
    React.useEffect(() => { onDone(); }, []);
    return null;
  },
}));

import { loadStory } from "../api/storyDb";
import { apiFetch } from "../lib/api";

const renderPlayer = (id = "1") =>
  render(
    <MemoryRouter initialEntries={[`/player/${id}`]}>
      <Routes>
        <Route path="/player/:id" element={<Player />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  (loadStory as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});

describe("Player", () => {
  it("renders the carousel, text reader, and navigation on mount", async () => {
    renderPlayer();
    expect(screen.getByText("Back to Library")).toBeInTheDocument();
    expect(screen.getByText("Create New Story")).toBeInTheDocument();
    // stories[0] is "The Moon's Lullaby" from mock data
    expect(screen.getByText("The Moon's Lullaby")).toBeInTheDocument();
  });

  it("uses saved story from db on mount if available", async () => {
    (loadStory as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "1",
      title: "Saved Dragon Tale",
      summary: "A saved story.",
      text: ["Once upon a time"],
      coverImage: "data:image/png;base64,saved",
      images: ["data:image/png;base64,saved"],
      childName: "Alice",
      age: 5,
      theme: "dragons",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    renderPlayer();
    await waitFor(() => {
      expect(screen.getAllByText("Saved Dragon Tale").length).toBeGreaterThan(0);
    });
  });

  it("shows paginated text from the story", async () => {
    (loadStory as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "1",
      title: "Forest Tale",
      summary: "A forest story.",
      text: ["Paragraph one", "Paragraph two", "Paragraph three", "Paragraph four"],
      coverImage: "data:image/png;base64,img",
      childName: "Sam",
      age: 6,
      theme: "forest",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    renderPlayer();
    await waitFor(() => {
      expect(screen.getAllByText("Paragraph one").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/Page 1 of 4/).length).toBeGreaterThan(0);
  });

  it("navigates pages with prev/next buttons", async () => {
    (loadStory as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "1",
      title: "Forest Tale",
      summary: "A story.",
      text: ["First paragraph", "Second paragraph"],
      coverImage: "data:image/png;base64,img",
      childName: "Sam",
      age: 6,
      theme: "forest",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    renderPlayer();
    await waitFor(() => {
      expect(screen.getAllByText("First paragraph").length).toBeGreaterThan(0);
    });
    // LargeStoryPlayer uses "Next page" aria-label
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(screen.getAllByText("Second paragraph").length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Regression: Player must not call the backend with non-UUID story IDs.
// Timestamp IDs (String(Date.now())) caused Prisma "invalid UUID length: 13".
// ---------------------------------------------------------------------------

describe("Player UUID guard", () => {
  const apiFetchMock = apiFetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetchMock.mockClear();
    (loadStory as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("does not call the backend for a timestamp story id", async () => {
    const timestampId = String(Date.now()); // 13-char, not a UUID
    renderPlayer(timestampId);

    // Give the effect time to run
    await waitFor(() => {
      expect(apiFetchMock).not.toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/stories\//),
        expect.anything(),
      );
    });
  });

  it("calls the backend for a valid UUID story id not found locally", async () => {
    const uuid = crypto.randomUUID();
    apiFetchMock.mockResolvedValueOnce({
      id: uuid, title: "Remote Story", summary: "From backend.",
      paragraphs: ["Once"], image_urls: [], cover_url: null,
    });

    renderPlayer(uuid);

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(`/api/stories/${uuid}`);
    });
  });
});
