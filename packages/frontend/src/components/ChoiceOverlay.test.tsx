import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ChoiceOverlay } from "./ChoiceOverlay";
import type { StoryChoice } from "@bedtime/shared";

vi.mock("./AudioControls", () => ({
  VOICE_PROFILES: [{ id: "default", name: "Default", keywords: ["default"] }],
}));

const choices: [StoryChoice, StoryChoice] = [
  {
    label: "Follow the fireflies",
    trait: "curious",
    targetNodeId: "leaf-a",
    preview_text: "The lights dance deeper into the woods.",
  },
  {
    label: "Take the stone path",
    trait: "brave",
    targetNodeId: "leaf-b",
    preview_text: "The path leads to an ancient castle.",
  },
];

describe("ChoiceOverlay", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("renders both choices and the hero prompt", () => {
    render(<ChoiceOverlay choices={choices} childName="Lily" onSelect={vi.fn()} />);
    expect(screen.getByText("What should Lily do?")).toBeInTheDocument();
    expect(screen.getByText("Follow the fireflies")).toBeInTheDocument();
    expect(screen.getByText("The lights dance deeper into the woods.")).toBeInTheDocument();
    expect(screen.getByText("Take the stone path")).toBeInTheDocument();
    expect(screen.getByText("The path leads to an ancient castle.")).toBeInTheDocument();
  });

  it("falls back to 'the hero' when no childName is provided", () => {
    render(<ChoiceOverlay choices={choices} onSelect={vi.fn()} />);
    expect(screen.getByText("What should the hero do?")).toBeInTheDocument();
  });

  it("shows the countdown timer", () => {
    render(<ChoiceOverlay choices={choices} childName="Lily" onSelect={vi.fn()} />);
    expect(screen.getByText(/Choosing in 45s/)).toBeInTheDocument();
  });

  it("choice buttons are disabled during the 2-second lockout", () => {
    render(<ChoiceOverlay choices={choices} childName="Lily" onSelect={vi.fn()} />);
    const btn = screen.getByText("Follow the fireflies").closest("button")!;
    expect(btn).toBeDisabled();
  });

  it("choice buttons become enabled after the 2-second lockout", () => {
    render(<ChoiceOverlay choices={choices} childName="Lily" onSelect={vi.fn()} />);
    const btn = screen.getByText("Follow the fireflies").closest("button")!;
    act(() => { vi.advanceTimersByTime(2100); });
    expect(btn).not.toBeDisabled();
  });

  it("calls onSelect with the correct choice when clicked after lockout", () => {
    const onSelect = vi.fn();
    render(<ChoiceOverlay choices={choices} childName="Lily" onSelect={onSelect} />);
    act(() => { vi.advanceTimersByTime(2100); });
    fireEvent.click(screen.getByText("Follow the fireflies"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(choices[0]);
  });

  it("calls onSelect with the second choice when second button is clicked", () => {
    const onSelect = vi.fn();
    render(<ChoiceOverlay choices={choices} childName="Lily" onSelect={onSelect} />);
    act(() => { vi.advanceTimersByTime(2100); });
    fireEvent.click(screen.getByText("Take the stone path"));
    expect(onSelect).toHaveBeenCalledWith(choices[1]);
  });

  it("does not fire onSelect when a locked button is clicked", () => {
    const onSelect = vi.fn();
    render(<ChoiceOverlay choices={choices} childName="Lily" onSelect={onSelect} />);
    // Within the 2-second lockout
    fireEvent.click(screen.getByText("Follow the fireflies"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("countdown display decrements each second", async () => {
    render(<ChoiceOverlay choices={choices} childName="Lily" onSelect={vi.fn()} />);
    expect(screen.getByText(/Choosing in 45s/)).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText(/Choosing in 44s/)).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText(/Choosing in 43s/)).toBeInTheDocument();
  });

  it("auto-selects the first choice after the 45-second timeout", async () => {
    const onSelect = vi.fn();
    render(<ChoiceOverlay choices={choices} childName="Lily" onSelect={onSelect} />);
    // Each 1-second tick needs its own async act() so React flushes state and schedules
    // the next cascading setTimeout before the next tick is advanced.
    for (let i = 0; i < 46; i++) {
      await act(async () => { vi.advanceTimersByTime(1000); });
    }
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(choices[0]);
  });
});
