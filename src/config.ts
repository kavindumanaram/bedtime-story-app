export const config = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
    chatModel: "gpt-4o-mini",
    imageModel: "gpt-image-1-mini",
    imageSize: "1536x1024" as const,
  },
} as const;
