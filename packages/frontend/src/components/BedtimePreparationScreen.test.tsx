import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { BedtimePreparationScreen } from "./BedtimePreparationScreen";

// Silence Web Audio API noise in jsdom
vi.stubGlobal("AudioContext", undefined);
vi.stubGlobal("webkitAudioContext", undefined);

const baseProps = {
  childName: "Lily",
  storyTitle: "The Dragon's Dream",
  theme: "dragons",
  onComplete: vi.fn(),
  onSkip: vi.fn(),
};

beforeEach(() => {
  vi.useFakeTimers();
  baseProps.onComplete.mockReset();
  baseProps.onSkip.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BedtimePreparationScreen — completion gating", () => {
  it("does NOT call onComplete before minDurationMs even if readyToAdvance is true", () => {
    render(
      <BedtimePreparationScreen
        {...baseProps}
        minDurationMs={35_000}
        readyToAdvance={true}
      />,
    );
    // Just before the timer fires
    act(() => { vi.advanceTimersByTime(34_999); });
    expect(baseProps.onComplete).not.toHaveBeenCalled();
  });

  it("calls onComplete after minDurationMs when readyToAdvance is true from the start", () => {
    render(
      <BedtimePreparationScreen
        {...baseProps}
        minDurationMs={35_000}
        readyToAdvance={true}
      />,
    );
    act(() => { vi.advanceTimersByTime(35_000 + 700); }); // +700 for dismiss timeout
    expect(baseProps.onComplete).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onComplete after minDurationMs when readyToAdvance is false", () => {
    render(
      <BedtimePreparationScreen
        {...baseProps}
        minDurationMs={35_000}
        readyToAdvance={false}
      />,
    );
    act(() => { vi.advanceTimersByTime(60_000); }); // well past timer
    expect(baseProps.onComplete).not.toHaveBeenCalled();
  });

  it("calls onComplete when readyToAdvance becomes true after minDurationMs elapsed", () => {
    const { rerender } = render(
      <BedtimePreparationScreen
        {...baseProps}
        minDurationMs={35_000}
        readyToAdvance={false}
      />,
    );
    // Min duration fires — readyToAdvance still false → no dismiss
    act(() => { vi.advanceTimersByTime(36_000); });
    expect(baseProps.onComplete).not.toHaveBeenCalled();

    // readyToAdvance becomes true — should dismiss now
    rerender(
      <BedtimePreparationScreen
        {...baseProps}
        minDurationMs={35_000}
        readyToAdvance={true}
      />,
    );
    act(() => { vi.advanceTimersByTime(700); }); // dismiss timeout
    expect(baseProps.onComplete).toHaveBeenCalledTimes(1);
  });

  it("auto-completes when readyToAdvance is undefined (default behaviour)", () => {
    render(
      <BedtimePreparationScreen
        {...baseProps}
        minDurationMs={5_000}
        // readyToAdvance not passed → defaults to always-ready
      />,
    );
    act(() => { vi.advanceTimersByTime(5_000 + 700); });
    expect(baseProps.onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not call onComplete twice (dismiss guard)", () => {
    const { rerender } = render(
      <BedtimePreparationScreen
        {...baseProps}
        minDurationMs={5_000}
        readyToAdvance={true}
      />,
    );
    act(() => { vi.advanceTimersByTime(6_000); });
    rerender(
      <BedtimePreparationScreen
        {...baseProps}
        minDurationMs={5_000}
        readyToAdvance={true}
      />,
    );
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(baseProps.onComplete).toHaveBeenCalledTimes(1);
  });
});
