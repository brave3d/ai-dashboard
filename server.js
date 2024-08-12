const express = require('express');
const fal = require("@fal-ai/serverless-client");
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://brave3d.github.io'
}));

app.use(express.static(path.join(__dirname, 'public')));

// Configure the client with the API key
fal.config({
  credentials: process.env.FAL_KEY
});

app.get('/generate-stream', async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const { prompt, imageSize, numSteps, seed, guidanceScale, numImages, enableSafetyChecker } = req.query;

    try {
        const result = await fal.subscribe("fal-ai/flux", {
            input: {
                prompt,
                image_size: imageSize || 'landscape_4_3',
                num_inference_steps: parseInt(numSteps) || 28,
                seed: seed ? parseInt(seed) : undefined,
                guidance_scale: parseFloat(guidanceScale) || 3.5,
                num_images: parseInt(numImages) || 1,
                enable_safety_checker: enableSafetyChecker === 'true'
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.forEach(log => {
                        res.write(`data: ${JSON.stringify({ type: 'log', message: log.message })}\n\n`);
                    });
                }
            },
        });

        const output = {
            images: result.images,
            prompt: result.prompt,
            seed: result.seed,
            has_nsfw_concepts: result.has_nsfw_concepts,
            timings: result.timings,
        };

        res.write(`data: ${JSON.stringify({ type: 'result', data: output })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Error generating image:", error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});