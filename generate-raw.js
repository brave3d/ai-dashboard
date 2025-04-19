// Load environment variables from .env file
require('dotenv').config();

const fal = require("@fal-ai/serverless-client");

// Configure the client with the API key
fal.config({
  credentials: process.env.FAL_KEY
});

(async () => {
  try {
    console.log(`Generating image with aspect ratio: ${aspectRatio}`);

    const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        num_images: numImages,
        enable_safety_checker: enableSafetyChecker,
        output_format: outputFormat,
        ...(seed !== undefined && { seed: seed }),
        raw
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log(result);
  } catch (error) {
    console.error("Error generating image:", error);
  }
})();