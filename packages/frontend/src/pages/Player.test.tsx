import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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
  persistChoiceSelection: vi.fn().mockResolvedValue(undefined),
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
// Branching story: ChoiceOverlay appears when a branching story root node is
// fully read, confirming the isChoicePoint → showChoiceOverlay integration.
// ---------------------------------------------------------------------------

describe("Player — branching story ChoiceOverlay", () => {
  // Restore real timers after every test in this block so fake-timer state cannot
  // bleed into subsequent describe blocks (e.g., UUID guard tests use real waitFor).
  afterEach(() => { vi.useRealTimers(); });

  const rootNodeId = "00000000-aaaa-aaaa-aaaa-000000000001";
  const leafAId    = "00000000-bbbb-bbbb-bbbb-000000000002";
  const leafBId    = "00000000-cccc-cccc-cccc-000000000003";

  const branchingStory = {
    id: "1",
    title: "The Magic Forest",
    summary: "A branching adventure.",
    text: ["Lily stood at the crossroads of the enchanted forest."],
    is_branching: true,
    story_graph: {
      rootNode: {
        id: rootNodeId,
        type: "root",
        paragraphs: ["Lily stood at the crossroads of the enchanted forest."],
        sceneImages: [],
        audioUrls: [],
      },
      choices: [
        { label: "Follow the fireflies", trait: "curious", targetNodeId: leafAId, preview_text: "The lights dance deeper." },
        { label: "Take the stone path",  trait: "brave",   targetNodeId: leafBId, preview_text: "The path leads to a castle." },
      ],
      leafNodes: [
        { id: leafAId, type: "leaf", paragraphs: ["The fireflies led Lily to a magical glade."], sceneImages: [], audioUrls: [] },
        { id: leafBId, type: "leaf", paragraphs: ["The stone path ended at a sleeping dragon."],  sceneImages: [], audioUrls: [] },
      ],
    },
    coverImage: "data:image/png;base64,img",
    childName: "Lily",
    age: 6,
    theme: "forest",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("shows ChoiceOverlay with both choices when the root node is the last page", async () => {
    (loadStory as ReturnType<typeof vi.fn>).mockResolvedValue(branchingStory);
    renderPlayer();
    await waitFor(() => {
      expect(screen.getByText(/What should.*do\?/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Follow the fireflies")).toBeInTheDocument();
    expect(screen.getByText("Take the stone path")).toBeInTheDocument();
  });

  // Regression: clicking a choice must load the leaf content (Player.tsx — handleChoiceSelect)
  it("transitions to the selected leaf node's paragraph after a choice is made", async () => {
    vi.useFakeTimers();
    (loadStory as ReturnType<typeof vi.fn>).mockResolvedValue(branchingStory);
    renderPlayer();
    await act(async () => { await Promise.resolve(); });
    // Advance past ChoiceOverlay appearance (200ms, no speechSynthesis in JSDOM)
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(screen.getByText(/What should.*do\?/i)).toBeInTheDocument();
    // Advance past the 2-second button lockout
    await act(async () => { vi.advanceTimersByTime(2100); });
    await act(async () => { fireEvent.click(screen.getByText("Follow the fireflies")); });
    // Overlay gone; leaf paragraph now in DOM
    expect(screen.queryByText(/What should.*do\?/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("The fireflies led Lily to a magical glade.").length).toBeGreaterThan(0);
  });

  // Regression: after a choice, narration must auto-start for the leaf node
  it("auto-starts narration for the leaf node after a choice is selected", async () => {
    const speakMock = vi.fn();
    // SpeechSynthesisUtterance is not in JSDOM; provide a minimal stub so ChoiceOverlay
    // and speakParagraph can construct utterances without throwing.
    const UtteranceStub = vi.fn().mockImplementation((text: string) => ({
      text, rate: 1, lang: "", voice: null, onstart: null, onend: null, onerror: null,
    }));
    (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = UtteranceStub;
    Object.defineProperty(window, "speechSynthesis", {
      value: { speak: speakMock, cancel: vi.fn(), speaking: false, getVoices: () => [], onvoiceschanged: null },
      writable: true, configurable: true,
    });
    try {
      vi.useFakeTimers();
      (loadStory as ReturnType<typeof vi.fn>).mockResolvedValue(branchingStory);
      renderPlayer();
      await act(async () => { await Promise.resolve(); });
      // With speechSynthesis present, overlay appears at 900ms (autoplay+TTS path)
      await act(async () => { vi.advanceTimersByTime(1000); });
      expect(screen.getByText(/What should.*do\?/i)).toBeInTheDocument();
      // Clear the ChoiceOverlay's "What should Lily do?" TTS prompt
      speakMock.mockClear();
      // Advance past the 2-second button lockout (ChoiceOverlay mounts at ~900ms)
      await act(async () => { vi.advanceTimersByTime(2100); });
      // Select a choice
      await act(async () => { fireEvent.click(screen.getByText("Follow the fireflies")); });
      // Advance past the 350ms narration start delay
      await act(async () => { vi.advanceTimersByTime(400); });
      // Narration must start for the leaf paragraph
      expect(speakMock).toHaveBeenCalledTimes(1);
      const utter = speakMock.mock.calls[0][0] as SpeechSynthesisUtterance;
      expect(utter.text).toBe("The fireflies led Lily to a magical glade.");
    } finally {
      // Delete both stubs so subsequent tests see a clean window without speechSynthesis.
      delete (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance;
      delete (window as unknown as Record<string, unknown>).speechSynthesis;
    }
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
