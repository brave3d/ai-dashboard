const express = require('express');
const fal = require("@fal-ai/serverless-client");
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs').promises;

const upload = multer({ storage: multer.memoryStorage() });

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

    // Destructure ALL potential parameters from the query string
    const { prompt, imageSize, aspectRatio, numSteps, seed, guidanceScale, numImages, enableSafetyChecker, model, loraUrl, loraScale, outputFormat } = req.query;
    
    try {
        const loras = loraUrl ? [{ path: loraUrl, scale: parseFloat(loraScale) || 1 }] : [];
        
        let result;
        let output;

        // --- Add conditional logic based on model --- 
        if (model === 'fal-ai/flux-pro/v1.1-ultra') {
            console.log(`Handling Flux Pro Ultra request with aspectRatio: ${aspectRatio}`);
            // For Flux Pro Ultra, call fal.subscribe with aspect_ratio
            // Note: generateImage function from generate-raw.js is not used here, calling subscribe directly
            result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
              input: {
                prompt,
                aspect_ratio: aspectRatio || '16:9', // Use aspect_ratio from query
                num_images: parseInt(numImages) || 1,
                enable_safety_checker: enableSafetyChecker === 'true',
                output_format: outputFormat || 'jpeg',
                seed: seed ? parseInt(seed) : undefined,
                // Flux Pro doesn't use numSteps or guidanceScale in the same way
                // Check API docs if other params are needed
              },
              logs: true,
              onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                  update.logs.map((log) => log.message).forEach(msg => {
                    res.write(`data: ${JSON.stringify({ type: 'log', message: msg })}\n\n`);
                  });
                }
              },
            });
            
            // Structure output similarly for consistency
            output = {
                images: result.images,
                prompt: result.prompt,
                seed: result.seed,
                has_nsfw_concepts: result.has_nsfw_concepts,
                timings: result.timings, // Assuming result has timings
            };
            
        } else {
            console.log(`Handling non-Flux Pro Ultra request (${model}) with imageSize: ${imageSize}`);
            
            // Prepare base input object for non-Flux models
            const inputPayload = {
                prompt,
                image_size: imageSize || 'square_hd', // Default to square_hd based on error
                num_inference_steps: parseInt(numSteps) || 28,
                seed: seed && seed !== 'random' ? parseInt(seed) : undefined,
                guidance_scale: parseFloat(guidanceScale) || 3.5,
                num_images: parseInt(numImages) || 1,
                enable_safety_checker: enableSafetyChecker === 'true',
                loras: loras
            };

            // --- Add model_name specifically for fal-ai/lora endpoint --- 
            if (model === 'fal-ai/lora') {
                const baseModelName = req.query.baseModelName; // Get baseModelName from query
                if (!baseModelName) {
                    // Throw an error or handle it if baseModelName is missing
                    throw new Error('baseModelName query parameter is required for fal-ai/lora endpoint');
                }
                inputPayload.model_name = baseModelName; // Add the base model name
                console.log(`Using base model: ${baseModelName} for fal-ai/lora`);
            }
            // --- End specific addition ---

            // For other models, use the original approach with image_size
            result = await fal.subscribe(model, {
                input: inputPayload, // Use the constructed payload
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === "IN_PROGRESS") {
                        update.logs.forEach(log => {
                            res.write(`data: ${JSON.stringify({ type: 'log', message: log.message })}\n\n`);
                        });
                    }
                },
            });

            // Structure output
            output = {
                images: result.images,
                prompt: result.prompt,
                seed: result.seed,
                has_nsfw_concepts: result.has_nsfw_concepts,
                timings: result.timings, // Assuming result has timings
            };
        }
        // --- End conditional logic ---

        res.write(`data: ${JSON.stringify({ type: 'result', data: output })}\n\n`);
        res.end();
    } catch (error) {
        // Improved error logging
        console.error("Error details:", error);
        let errorMessage = error.message || 'Unknown error occurred';
        let errorDetails = null;
        let errorStatus = error.status || 500;

        // Check for nested validation errors (common with Fal API)
        if (error.status === 422 && error.body && error.body.detail) {
            errorDetails = error.body.detail;
            errorMessage = "Validation Error"; // Overwrite generic message
            if (Array.isArray(errorDetails)) {
              errorMessage += ": " + errorDetails.map(d => `Field '${d.loc.join('.')}': ${d.msg}`).join('; ');
            } else if (typeof errorDetails === 'string') {
              errorMessage += ": " + errorDetails;
            }
        } else if (error.response && error.response.data) { // Check axios-like errors
            errorDetails = error.response.data;
            errorStatus = error.response.status;
        }

        res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: errorMessage,
            details: errorDetails,
            status: errorStatus 
        })}\n\n`);
        res.end();
    }
});

app.get('/api/history', async (req, res) => {
    // console.log("--- Handling /api/history request ---"); // Removed log
    // console.log("Raw req.query:", req.query); // Removed log

    const { endpoint, page = 1 } = req.query; // Default page to 1
    // console.log(`Destructured endpoint: \"${endpoint}\", page: ${page}`); // Removed log
    
    // Basic validation
    if (!endpoint) {
        console.error("/api/history Error: Endpoint query parameter is missing or empty."); // Keep error log
        return res.status(400).json({ error: 'Missing endpoint query parameter' });
    }
    // Check Bearer Token AFTER confirming endpoint exists
    if (!process.env.BEARER_TOKEN) {
        console.error("BEARER_TOKEN environment variable not set!"); // Keep error log
        return res.status(500).json({ error: 'Server configuration error: Missing Bearer Token' });
    }

    // Encode the endpoint parameter for the URL
    const encodedEndpoint = encodeURIComponent(endpoint);
    // console.log(`Encoded endpoint: \"${encodedEndpoint}\"`); // Removed log

    const url = `https://rest.alpha.fal.ai/requests/by-endpoint?endpoint=${encodedEndpoint}&sort_by=ended_at&page=${page}&size=20`;
    // console.log(`Constructed Fal history URL: ${url}`); // Removed log

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${process.env.BEARER_TOKEN}` // Use process.env directly
            }
        });
        res.json(response.data);
    } catch (error) {
        // --- Improved Error Logging --- 
        console.error('Error fetching history from Fal REST API:');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', error.response.data); // Log the actual error response from Fal
            res.status(error.response.status).json({ 
                error: 'Failed to fetch history from Fal API', 
                fal_error: error.response.data 
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request Error (no response):', error.request);
            res.status(503).json({ error: 'Failed to fetch history: No response from Fal API' });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Axios Setup Error:', error.message);
            res.status(500).json({ error: 'Failed to fetch history: Internal Server Error' });
        }
        // --- End Improved Error Logging ---
    }
});

// Endpoint to delete Fal request input/output
app.post('/api/delete-fal-request/:requestId', async (req, res) => {
    const { requestId } = req.params;
    console.log(`Received request to delete Fal IO for request ID: ${requestId}`);

    if (!requestId) {
        return res.status(400).json({ error: 'Missing request ID' });
    }
    if (!process.env.BEARER_TOKEN) {
        console.error("BEARER_TOKEN environment variable not set for delete operation!");
        return res.status(500).json({ error: 'Server configuration error: Missing Bearer Token' });
    }

    const falDeleteUrl = `https://rest.alpha.fal.ai/requests/delete_io/${requestId}`;
    console.log(`Calling Fal delete endpoint: ${falDeleteUrl}`);

    try {
        const response = await axios.put(falDeleteUrl, {}, { // Use PUT method
            headers: {
                'Authorization': `Bearer ${process.env.BEARER_TOKEN}`,
                'Content-Type': 'application/json' // Content-Type might still be needed
            }
        });

        console.log(`Fal delete API response status: ${response.status}`);
        // Fal API returns 200 OK on success, usually with no body or simple confirmation
        res.status(response.status).json({ message: 'Deletion request successful', fal_response: response.data || {} });

    } catch (error) {
        console.error(`Error calling Fal delete API for ${requestId}:`);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', error.response.data);
            res.status(error.response.status).json({
                error: `Failed to delete from Fal API: ${error.response.data?.detail || error.response.statusText || 'Unknown Fal Error'}`,
                fal_error: error.response.data
            });
        } else if (error.request) {
            console.error('Request Error (no response):', error.request);
            res.status(503).json({ error: 'Deletion failed: No response from Fal API' });
        } else {
            console.error('Axios Setup Error:', error.message);
            res.status(500).json({ error: 'Deletion failed: Internal Server Error' });
        }
    }
});

// Endpoint to upload image/video input for video models
app.post('/api/upload-video-input', upload.single('videoInputFile'), async (req, res) => {
    console.log("Received file upload request for video input.");
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    if (!process.env.FAL_KEY) {
         console.error("FAL_KEY environment variable not set!");
         return res.status(500).json({ error: 'Server configuration error: Missing Fal API Key' });
    }

    try {
        console.log(`Uploading file "${req.file.originalname}" (${req.file.size} bytes) to Fal storage...`);
        
        // Upload the file buffer from memory storage to Fal
        const uploadedFileUrl = await fal.storage.upload(req.file.buffer, {
             fileName: req.file.originalname, // Optional: suggest filename
             contentType: req.file.mimetype, // Pass content type
        });

        console.log("File uploaded successfully:", uploadedFileUrl);
        res.json({ url: uploadedFileUrl });

    } catch (error) {
        console.error("Error uploading file to Fal storage:", error);
        res.status(500).json({ error: 'Failed to upload file to storage.' });
    }
});

// Endpoint for video generation stream
app.get('/generate-video-stream', async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
         'Access-Control-Allow-Origin': 'https://brave3d.github.io' 
    });

    const { model, prompt, imageUrl, seed /*, add other params like fps, duration */ } = req.query;
    console.log(`Received video generation request for model: ${model}`);

    if (!model || !prompt) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Missing required parameters: model or prompt' })}\n\n`);
        res.end();
        return;
    }
     if (!process.env.FAL_KEY) {
         console.error("FAL_KEY environment variable not set!");
         res.write(`data: ${JSON.stringify({ type: 'error', message: 'Server configuration error: Missing Fal API Key' })}\n\n`);
         res.end();
         return;
     }

    try {
        const inputPayload = {
            prompt: prompt,
            ...(seed && seed !== 'random' && { seed: parseInt(seed) }) 
        };

        if (imageUrl && model.includes('image-to-video')) { 
            inputPayload.image_url = imageUrl;
        } else if (!imageUrl && model.includes('image-to-video')) {
             throw new Error("Input image URL is required for this image-to-video model but was not provided.");
        }
        
        if (model === 'fal-ai/kling-video/v2/master/image-to-video') {
            // inputPayload.motion_bucket_id = parseInt(req.query.motionBucketId) || 127; 
            // inputPayload.fps = parseInt(req.query.fps) || 24;
        }

        console.log("Calling Fal subscribe with payload:", inputPayload);

        const result = await fal.subscribe(model, {
            input: inputPayload,
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.forEach(log => {
                        res.write(`data: ${JSON.stringify({ type: 'log', message: log.message })}\n\n`);
                    });
                }
            },
        });

        console.log("Fal subscribe finished, sending result:", result);
        res.write(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`);

    } catch (error) {
        console.error("Error during video generation stream:", error);
        let errorMessage = error.message || 'Unknown video generation error';
        res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`);
    } finally {
        res.end(); // Close the SSE connection
    }
});

// Endpoint to fetch video history
app.get('/api/video-history', async (req, res) => {
    console.log("--- Handling /api/video-history request ---"); 
    const { endpoint, page = 1 } = req.query; 
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint query parameter' });
    if (!process.env.BEARER_TOKEN) return res.status(500).json({ error: 'Server configuration error: Missing Bearer Token' });

    const encodedEndpoint = encodeURIComponent(endpoint);
    const url = `https://rest.alpha.fal.ai/requests/by-endpoint?endpoint=${encodedEndpoint}&sort_by=ended_at&page=${page}&size=20`; 
    console.log(`Constructed Fal video history URL: ${url}`); 

    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` }
        });
        res.json(response.data); 
    } catch (error) {
         console.error('Error fetching video history from Fal REST API:');
        if (error.response) {
            console.error('Status:', error.response.status); console.error('Data:', error.response.data);
            res.status(error.response.status).json({ error: 'Failed to fetch video history from Fal API', fal_error: error.response.data });
        } else if (error.request) {
            console.error('Request Error:', error.request);
            res.status(503).json({ error: 'No response from Fal API' });
        } else {
            console.error('Setup Error:', error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

// Endpoint to delete Fal video request input/output
app.post('/api/delete-fal-video-request/:requestId', async (req, res) => {
    const { requestId } = req.params;
    console.log(`Received request to delete Fal video IO for request ID: ${requestId}`);
    if (!requestId) return res.status(400).json({ error: 'Missing request ID' });
    if (!process.env.BEARER_TOKEN) return res.status(500).json({ error: 'Server configuration error: Missing Bearer Token' });

    const falDeleteUrl = `https://rest.alpha.fal.ai/requests/delete_io/${requestId}`;
    console.log(`Calling Fal delete endpoint (PUT): ${falDeleteUrl}`);

    try {
        const response = await axios.put(falDeleteUrl, {}, { 
            headers: { 'Authorization': `Bearer ${process.env.BEARER_TOKEN}`, 'Content-Type': 'application/json' }
        });
        console.log(`Fal delete API response status: ${response.status}`);
        res.status(response.status).json({ message: 'Deletion request successful', fal_response: response.data || {} });
    } catch (error) {
         console.error(`Error calling Fal delete API for ${requestId}:`);
        if (error.response) {
             console.error('Status:', error.response.status); console.error('Data:', error.response.data);
             res.status(error.response.status).json({ error: `Failed to delete from Fal API: ${error.response.data?.detail || 'Unknown Error'}`, fal_error: error.response.data });
         } else if (error.request) { res.status(503).json({ error: 'No response from Fal API' }); }
         else { res.status(500).json({ error: 'Internal Server Error' }); }
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});