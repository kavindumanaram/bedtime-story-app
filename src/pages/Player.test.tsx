import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Player } from "./Player";

vi.mock("../api/storyDb", () => ({
  loadStory: vi.fn().mockResolvedValue(undefined),
}));

import { loadStory } from "../api/storyDb";

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
    expect(screen.getByText("Story Text")).toBeInTheDocument();
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

  it("navigates paragraphs with prev/next buttons", async () => {
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
    fireEvent.click(screen.getByLabelText("Next paragraph"));
    expect(screen.getAllByText("Second paragraph").length).toBeGreaterThan(0);
  });
});
