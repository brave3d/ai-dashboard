const express = require('express');
const fal = require("@fal-ai/serverless-client");
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://brave3d.github.io'
}));
const BEARER_TOKEN = process.env.BEARER_TOKEN;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Configure the client with the API key
fal.config({
  credentials: process.env.FAL_KEY
});

app.get('/generate-stream', async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': 'https://brave3d.github.io'
    });

    const { prompt, imageSize, numSteps, seed, guidanceScale, numImages, enableSafetyChecker, model, loraUrl, loraScale } = req.query;
    try {
        const loras = loraUrl ? [{ path: loraUrl, scale: parseFloat(loraScale) || 1 }] : [];

        const result = await fal.subscribe(model, {
            input: {
                prompt,
                image_size: imageSize || 'landscape_4_3',
                num_inference_steps: parseInt(numSteps) || 28,
                seed: seed ? parseInt(seed) : undefined,
                guidance_scale: parseFloat(guidanceScale) || 3.5,
                num_images: parseInt(numImages) || 1,
                enable_safety_checker: false,
                safety_tolerance: 6,
                loras: loras
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

app.get('/api/history', async (req, res) => {
    const { model, page } = req.query;
    const url = `https://rest.alpha.fal.ai/requests/by-endpoint?endpoint=${model}&sort_by=ended_at&page=${page}&size=20`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});