import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Player } from "./Player";

vi.mock("../api/openaiApi", () => ({
  generateStory: vi.fn(),
  generateCoverImage: vi.fn(),
}));

vi.mock("../api/storyDb", () => ({
  saveStory: vi.fn(),
  loadStory: vi.fn().mockResolvedValue(undefined),
}));

import { generateStory, generateCoverImage } from "../api/openaiApi";
import { saveStory, loadStory } from "../api/storyDb";

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
  it("renders the story player and generation form on mount", async () => {
    renderPlayer();
    expect(screen.getByText("Story Player")).toBeInTheDocument();
    expect(screen.getByText("Generate a Story")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Child's name")).toBeInTheDocument();
    expect(screen.getByText("Generate Story")).toBeInTheDocument();
  });

  it("uses saved story from db on mount if available", async () => {
    (loadStory as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "1",
      title: "Saved Dragon Tale",
      summary: "A saved story.",
      text: ["Once upon a time"],
      coverImage: "data:image/png;base64,saved",
      childName: "Alice",
      age: 5,
      theme: "dragons",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    renderPlayer();
    await waitFor(() => {
      expect(screen.getByText("Saved Dragon Tale")).toBeInTheDocument();
    });
  });

  it("disables the Generate Story button while loading", async () => {
    (generateStory as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}),
    );
    renderPlayer();
    fireEvent.click(screen.getByText("Generate Story"));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Writing your story/i })).toBeDisabled();
    });
  });

  it('shows "Writing your story..." during story generation', async () => {
    (generateStory as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}),
    );
    renderPlayer();
    fireEvent.click(screen.getByText("Generate Story"));
    await waitFor(() => {
      expect(screen.getByText(/Writing your story/i)).toBeInTheDocument();
    });
  });

  it('shows "Drawing the cover..." during image generation', async () => {
    (generateStory as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: "Moon Night",
      summary: "A moonlit adventure.",
      text: ["P1", "P2", "P3", "P4"],
    });
    (generateCoverImage as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}),
    );
    renderPlayer();
    fireEvent.click(screen.getByText("Generate Story"));
    await waitFor(() => {
      expect(screen.getByText(/Drawing the cover/i)).toBeInTheDocument();
    });
  });

  it("updates story title and calls saveStory after generation completes", async () => {
    (generateStory as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: "The Magic Forest",
      summary: "A magical adventure.",
      text: ["P1", "P2", "P3", "P4"],
    });
    (generateCoverImage as ReturnType<typeof vi.fn>).mockResolvedValue(
      "data:image/png;base64,generatedImage",
    );

    renderPlayer();
    fireEvent.click(screen.getByText("Generate Story"));

    await waitFor(() => {
      expect(screen.getByText("The Magic Forest")).toBeInTheDocument();
    });
    expect(saveStory).toHaveBeenCalledOnce();
    expect((saveStory as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({
      title: "The Magic Forest",
      coverImage: "data:image/png;base64,generatedImage",
    });
  });

  it("shows an error message when generation fails", async () => {
    (generateStory as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("API rate limit exceeded"),
    );
    renderPlayer();
    fireEvent.click(screen.getByText("Generate Story"));
    await waitFor(() => {
      expect(screen.getByText("API rate limit exceeded")).toBeInTheDocument();
    });
  });
});
