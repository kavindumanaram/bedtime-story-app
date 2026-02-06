/**
 * Image generation API helpers
 * Handles story-to-image generation via AWS Lambda
 */

export type GenerateImageParams = {
  paragraph: string;
  storyId: string;
  paragraphIndex: number;
};

export type GenerateImageResponse = {
  ok: boolean;
  requestId: string;
  storyId: string;
  paragraphIndex: number;
  status: "processing" | "complete" | "failed";
  message?: string;
  image?: {
    url: string;
    s3: {
      bucket: string;
      key: string;
    };
  };
};

/**
 * Call image generation endpoint to start image creation for a story paragraph
 */
export async function generateImage(
  params: GenerateImageParams,
): Promise<GenerateImageResponse> {
  const url =
    "https://nkisb859uf.execute-api.ap-southeast-2.amazonaws.com/generate-story";
  const payload = {
    paragraph: params.paragraph,
    storyId: params.storyId,
    paragraphIndex: params.paragraphIndex,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Image generation request failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Poll image generation status using requestId
 */
export async function getImageStatus(
  requestId: string,
): Promise<GenerateImageResponse> {
  const url = `https://nkisb859uf.execute-api.ap-southeast-2.amazonaws.com/story-status/${requestId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Status check failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Poll status with retries (default delay 30s between checks)
 */
export async function waitForImageGeneration(
  requestId: string,
  maxRetries: number = 30,
  delayMs: number = 30000,
): Promise<GenerateImageResponse> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const status = await getImageStatus(requestId);
      if (status.status === "complete") {
        return status;
      }
      if (status.status === "failed") {
        throw new Error(`Image generation failed for requestId ${requestId}`);
      }
      // Still processing, wait and retry
      await new Promise((r) => setTimeout(r, delayMs));
      retries++;
    } catch (e) {
      console.error(`Status check attempt ${retries + 1} failed:`, e);
      if (retries >= maxRetries - 1) throw e;
      await new Promise((r) => setTimeout(r, delayMs));
      retries++;
    }
  }

  throw new Error(`Image generation timeout after ${maxRetries} retries`);
}

export default { generateImage, getImageStatus, waitForImageGeneration };
