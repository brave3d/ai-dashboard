// Load environment variables from .env file
require('dotenv').config();

const fal = require("@fal-ai/serverless-client");

// Configure the client with the API key
fal.config({
  credentials: process.env.FAL_KEY
});

// Get parameters from command line arguments
const [prompt, imageSize, numSteps, seed, guidanceScale, numImages, enableSafetyChecker] = process.argv.slice(2);

(async () => {
  try {
    const result = await fal.subscribe("fal-ai/flux-realism/", {
      input: {
        prompt,
        image_size: imageSize || 'landscape_4_3', // Default value if not provided
        num_inference_steps: parseInt(numSteps) || 28, // Default value if not provided
        seed: seed ? parseInt(seed) : undefined, // Only include seed if provided
        guidance_scale: parseFloat(guidanceScale) || 3.5, // Default value if not provided
        num_images: parseInt(numImages) || 1, // Default value if not provided
        enable_safety_checker: enableSafetyChecker === 'true' // Enable safety checker based on the parameter
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    // Ensure the result is a valid JSON object
    const output = {
      images: result.images,
      prompt: result.prompt,
      seed: result.seed,
      has_nsfw_concepts: result.has_nsfw_concepts,
      timings: result.timings
    };

    process.stdout.write(JSON.stringify(output));
  } catch (error) {
    process.stderr.write(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
})();