export type GenerateStoryParams = {
  childName: string;
  age: number;
  theme: string;
};

export type GeneratedStory = {
  title?: string;
  summary?: string;
  text?: string[];
  [key: string]: any;
};

/**
 * Call the story-generation POST endpoint.
 * The API expects a JSON body with a stringified `body` field.
 */
export async function generateStory(params: GenerateStoryParams): Promise<GeneratedStory | string> {
  const url = "https://xk9k3oja8b.execute-api.ap-southeast-2.amazonaws.com/generate-story";
  const payload = {
    body: JSON.stringify({ childName: params.childName, age: params.age, theme: params.theme }),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  // Try to parse JSON responses, else return plain text
  try {
    const json = JSON.parse(text);

    // Some APIs return { body: "{...}" } where body is stringified JSON
    if (json && typeof json.body === "string") {
      try {
        return JSON.parse(json.body);
      } catch (e) {
        // Return the raw body string if parsing fails
        return json.body;
      }
    }

    return json;
  } catch (e) {
    return text;
  }
}

export default generateStory;
