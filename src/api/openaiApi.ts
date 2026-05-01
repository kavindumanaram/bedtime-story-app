import { config } from "../config";

export type StoryContent = {
  title: string;
  summary: string;
  text: string[];
};

export async function generateStory(
  childName: string,
  age: number,
  theme: string,
): Promise<StoryContent> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openai.chatModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a children's bedtime story writer. Reply with JSON only.",
        },
        {
          role: "user",
          content: `Write a short bedtime story for ${childName}, age ${age}, about "${theme}". Return JSON with: title (string), summary (one sentence string), text (array of exactly 4 short paragraphs).`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Story generation failed: ${res.statusText}`);
  }

  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return {
    title: parsed.title ?? `A Story for ${childName}`,
    summary: parsed.summary ?? "",
    text: Array.isArray(parsed.text) ? parsed.text : [],
  };
}

export async function generateCoverImage(
  title: string,
  summary: string,
): Promise<string> {
  const prompt = `Create a cozy children's bedtime storybook cover illustration for a story called "${title}": ${summary}. Style: modern soft cartoon, pastel colours, warm lighting, high quality. No text, no watermarks, safe for children.`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openai.imageModel,
      prompt,
      size: config.openai.imageSize,
      n: 1,
    }),
  });

  if (!res.ok) {
    throw new Error(`Image generation failed: ${res.statusText}`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from OpenAI");

  return `data:image/png;base64,${b64}`;
}
