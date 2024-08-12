// Load environment variables from .env file
require('dotenv').config();

const fal = require("@fal-ai/serverless-client");

// Configure the client with the API key
fal.config({
  credentials: process.env.FAL_KEY
});

(async () => {
  try {
    const result = await fal.subscribe("fal-ai/flux", {
      input: {
        prompt: "a figurine of a fairy with pearls on a pink background, with a, stunning 3d render of a fairy, fairylike, fairy magnificent, beautiful fairy, fairy cgsociety, fairycore, beautiful fairie, beautiful fantasy art, fantasy art, faerie, fantasy beautiful, very beautiful fantasy art, astral fairy, beautiful detailed fantasy, beautiful adult fairy, digital art fantasy art, amazing fantasy art, digital art fantasy, fairy, beautiful fantasy",
        enable_safety_checker: false, // Disable safe generation filter
        num_images: 2,
        image_size: "portrait_16_9"
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