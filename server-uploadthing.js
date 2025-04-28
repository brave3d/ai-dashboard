const { createUploadthing } = require("uploadthing/server");
const { UTApi } = require("uploadthing/server");

// Create a new UploadThing instance
const f = createUploadthing();

// Check for environment variables
if (!process.env.UPLOADTHING_TOKEN) {
  console.error("Missing UPLOADTHING_TOKEN environment variable. Please set UPLOADTHING_TOKEN.");
}

// Create UploadThing API for administrative operations (optional)
const utapi = new UTApi({
  // In v7, we use the token instead of separate secret and app ID
  token: process.env.UPLOADTHING_TOKEN,
});

/**
 * Define file router with allowed file types, sizes, and authentication
 * This is where you'll specify your application's upload rules
 */
const fileRouter = {
  // Define an endpoint for uploading images
  imageUploader: f({
    image: {
      maxFileSize: "8MB", // Set max file size
      maxFileCount: 1,    // Only one file per upload
    }
  })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      // You would typically authenticate the user here
      
      // Example authentication check (implement according to your auth system)
      // const user = await yourAuthFunction(req);
      // if (!user) throw new Error("Unauthorized");
      
      // For this example, we're allowing all uploads for simplicity
      // In production, you should implement proper authentication
      
      // Return metadata that will be passed to onUploadComplete
      return { 
        uploadedAt: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on UploadThing's servers after upload completes
      console.log("Upload complete for file:", file.name);
      console.log("File URL:", file.url);
      console.log("File size:", file.size);
      console.log("Upload metadata:", metadata);
      
      // Return response that will be available to the client
      return { 
        url: file.url,
        uploadedAt: metadata.uploadedAt 
      };
    }),
};

/**
 * Export the file router and utapi for use in your server routes
 */
module.exports = {
  fileRouter,
  utapi
};

/*
IMPLEMENTATION NOTES:

1. Server Integration - Express Example:

const express = require('express');
const { createRouteHandler } = require("uploadthing/express");
const { fileRouter } = require("./server-uploadthing");

const app = express();

// Create a route handler for UploadThing
// In v7, createRouteHandler returns a single handler function instead of { GET, POST }
const handler = createRouteHandler({
  router: fileRouter,
  config: {
    // In v7, we use token instead of separate uploadthingId and uploadthingSecret
    token: process.env.UPLOADTHING_TOKEN,
  }
});

// Add the UploadThing route to your Express app
app.post("/api/uploadthing", async (req, res) => {
  try {
    // Handle the uploadthing request
    const result = await handler(req);
    return res.status(result.status).send(result.body);
  } catch (error) {
    console.error("Error in uploadthing route:", error);
    return res.status(500).send({ error: "Upload failed" });
  }
});

2. Environment Variables:
Make sure to set this environment variable:
- UPLOADTHING_TOKEN: Your UploadThing API token (contains both app ID and secret)

You can get this from your UploadThing dashboard after creating an account.
*/ 