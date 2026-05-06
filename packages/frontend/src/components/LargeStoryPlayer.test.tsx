/**
 * Regression tests for LargeStoryPlayer fullscreen behaviour.
 *
 * Bug: The unmount cleanup unconditionally called document.exitFullscreen(),
 * which exited fullscreen even when LargeStoryPlayer didn't enter it (e.g.
 * during StrictMode double-mount or when an intro overlay component owned
 * fullscreen). This caused the "Skip Intro exits fullscreen" bug.
 *
 * Fix: LargeStoryPlayer now tracks whether it entered fullscreen via
 * enteredFullscreenRef and only exits in cleanup if it did.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import LargeStoryPlayer from "./LargeStoryPlayer";

vi.mock("../hooks/useAmbientAudio", () => ({
  useAmbientAudio: () => ({ isPlaying: false, toggle: vi.fn() }),
}));

// Minimal fullscreen API shim for jsdom (which doesn't implement it)
function setupFullscreenMock() {
  let fullscreenElement: Element | null = null;
  const listeners: Array<() => void> = [];

  const requestFullscreen = vi.fn().mockImplementation(function (this: Element) {
    fullscreenElement = this;
    listeners.forEach((fn) => fn());
    return Promise.resolve();
  });

  const exitFullscreen = vi.fn().mockImplementation(() => {
    fullscreenElement = null;
    listeners.forEach((fn) => fn());
    return Promise.resolve();
  });

  const addListener = vi.fn().mockImplementation((_: string, fn: () => void) => {
    listeners.push(fn);
  });
  const removeListener = vi.fn();

  Object.defineProperty(document, "fullscreenElement", {
    get: () => fullscreenElement,
    configurable: true,
  });
  document.addEventListener = addListener as unknown as typeof document.addEventListener;
  document.removeEventListener = removeListener as unknown as typeof document.removeEventListener;
  HTMLElement.prototype.requestFullscreen = requestFullscreen;
  document.exitFullscreen = exitFullscreen;

  return { exitFullscreen, requestFullscreen, get fullscreenElement() { return fullscreenElement; } };
}

describe("LargeStoryPlayer fullscreen cleanup (Bug: Skip Intro exits fullscreen)", () => {
  let mock: ReturnType<typeof setupFullscreenMock>;

  beforeEach(() => {
    mock = setupFullscreenMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset fullscreenElement descriptor
    Object.defineProperty(document, "fullscreenElement", {
      get: () => null,
      configurable: true,
    });
  });

  it("does NOT call exitFullscreen on unmount when it never entered fullscreen", () => {
    const { unmount } = render(<LargeStoryPlayer />);
    unmount();
    expect(mock.exitFullscreen).not.toHaveBeenCalled();
  });

  it("calls exitFullscreen on unmount only when it entered fullscreen via toggleFullscreen", async () => {
    const { getByLabelText, unmount } = render(<LargeStoryPlayer />);

    // Trigger fullscreen via the button
    const fsBtn = getByLabelText(/fullscreen/i);
    await act(async () => { fireEvent.click(fsBtn); });

    // Confirm it's now fullscreen
    expect(mock.requestFullscreen).toHaveBeenCalledTimes(1);

    // Unmount — cleanup should exit fullscreen because we entered it
    unmount();
    expect(mock.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it("does NOT exit fullscreen on unmount after user already exited via Esc / toggle", async () => {
    const { getByLabelText, unmount } = render(<LargeStoryPlayer />);

    // Enter fullscreen
    const fsBtn = getByLabelText(/fullscreen/i);
    await act(async () => { fireEvent.click(fsBtn); });
    expect(mock.requestFullscreen).toHaveBeenCalledTimes(1);

    // Exit fullscreen manually (same button)
    await act(async () => { fireEvent.click(fsBtn); });
    expect(mock.exitFullscreen).toHaveBeenCalledTimes(1);

    // Unmount — should NOT call exitFullscreen again
    const callsBefore = mock.exitFullscreen.mock.calls.length;
    unmount();
    expect(mock.exitFullscreen.mock.calls.length).toBe(callsBefore);
  });
});
