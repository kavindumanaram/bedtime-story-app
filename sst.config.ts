/// <reference path=".sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "bedtime-story",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    }
  },
  async run() {
    const storyAssets = new sst.aws.Bucket("StoryAssets")

    const storyApi = new sst.aws.Function("StoryApi", {
      handler: "packages/backend/src/handler.handler",
      link: [storyAssets],
      url: true,
    })

    return {
      api: storyApi.url,
      bucket: storyAssets.name,
    }
  },
})
