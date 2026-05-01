import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateStory, generateCoverImage } from "./openaiApi";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const okJson = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(body),
  } as Response);

const errorResponse = (status = 500, statusText = "Internal Server Error") =>
  Promise.resolve({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({}),
  } as Response);

describe("generateStory", () => {
  it("calls the chat completions endpoint with correct method and headers", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Dragon Night",
                summary: "A dragon finds a friend.",
                text: ["P1", "P2", "P3", "P4"],
              }),
            },
          },
        ],
      }),
    );

    await generateStory("Alice", 5, "dragons");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["Authorization"]).toMatch(/^Bearer /);
  });

  it("parses the response into title, summary, and text", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Moon Song",
                summary: "The moon sings a lullaby.",
                text: ["Once", "Upon", "A", "Time"],
              }),
            },
          },
        ],
      }),
    );

    const result = await generateStory("Bob", 6, "moon");
    expect(result.title).toBe("Moon Song");
    expect(result.summary).toBe("The moon sings a lullaby.");
    expect(result.text).toEqual(["Once", "Upon", "A", "Time"]);
  });

  it("throws when fetch returns a non-ok status", async () => {
    mockFetch.mockReturnValueOnce(errorResponse(429, "Too Many Requests"));
    await expect(generateStory("Eve", 4, "stars")).rejects.toThrow(
      "Too Many Requests",
    );
  });
});

describe("generateCoverImage", () => {
  it("calls the images endpoint with b64_json response_format", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({ data: [{ b64_json: "abc123" }] }),
    );

    await generateCoverImage("Moon Song", "The moon sings.");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/images/generations");
    const body = JSON.parse(init.body);
    expect(body.n).toBe(1);
    expect(body.response_format).toBeUndefined();
  });

  it("returns a base64 data URL", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({ data: [{ b64_json: "abc123" }] }),
    );

    const result = await generateCoverImage("Title", "Summary");
    expect(result).toBe("data:image/png;base64,abc123");
  });

  it("throws when no image data is returned", async () => {
    mockFetch.mockReturnValueOnce(okJson({ data: [] }));
    await expect(generateCoverImage("Title", "Summary")).rejects.toThrow(
      "No image returned from OpenAI",
    );
  });

  it("throws when fetch returns a non-ok status", async () => {
    mockFetch.mockReturnValueOnce(errorResponse(401, "Unauthorized"));
    await expect(generateCoverImage("Title", "Summary")).rejects.toThrow(
      "Unauthorized",
    );
  });
});
