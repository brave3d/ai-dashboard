# Integrating UploadThing with Flux API Playground

This document explains how to fully integrate UploadThing into the Flux API Playground React application for handling file uploads.

## Prerequisites

1. Create an UploadThing account at [uploadthing.com](https://uploadthing.com)
2. Get your API keys from the UploadThing dashboard

## Installation

1. Install required packages:

```bash
npm install uploadthing @uploadthing/react
```

2. Create an UploadThing configuration file:

Create a new file at `src/services/uploadthing.js`:

```js
import { generateReactHelpers } from "@uploadthing/react";

export const { useUploadThing, uploadFiles } = generateReactHelpers();
```

## Backend Integration

1. Create an API route handler for UploadThing (if using Express):

```js
// server/routes/uploadthing.js
const express = require('express');
const router = express.Router();
const { createUploadthingExpressHandler } = require('uploadthing/express');
const { createUploadthing } = require('uploadthing/server');

const f = createUploadthing();

// FileRouter for your app
const uploadRouter = {
  // Define file routes
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      // Middleware to run before the upload
      return {}; // Return anything you want to be accessible in onUploadComplete
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Fire callback when upload completes
      console.log("Upload complete:", file.url);
      
      // Return URL for the frontend
      return { url: file.url };
    }),
};

// Create handler
const { handlers } = createUploadthingExpressHandler({
  router: uploadRouter,
  config: {
    uploadthingId: process.env.UPLOADTHING_APP_ID,
    uploadthingSecret: process.env.UPLOADTHING_SECRET,
  },
});

// API routes
router.post('/api/uploadthing', handlers.POST);
router.get('/api/uploadthing', handlers.GET);

module.exports = router;
```

2. Add environment variables:

```
UPLOADTHING_APP_ID=your-app-id
UPLOADTHING_SECRET=your-secret-key
```

## Frontend Integration

1. Update the ImageUpload component:

```jsx
import React, { useState } from 'react';
import { useUploadThing } from '../services/uploadthing';

function ImageUpload({ onFileSelect }) {
  const [preview, setPreview] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const { startUpload, permittedFileInfo, isUploading } = useUploadThing('imageUploader', {
    onClientUploadComplete: (res) => {
      setUploadStatus('Upload complete!');
      if (res && res[0]) {
        onFileSelect(res[0].url);
      }
      setTimeout(() => setUploadStatus(''), 2000);
    },
    onUploadError: (error) => {
      setUploadStatus(`Error: ${error.message}`);
      console.error('Upload error:', error);
    },
  });

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Upload file
    setUploadStatus('Uploading...');
    await startUpload([file]);
  };

  return (
    <div className="border-2 border-dashed border-gray-400 p-4 rounded-lg text-center mb-4">
      <input
        type="file"
        id="imageUploadInput"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <label 
        htmlFor="imageUploadInput" 
        className="cursor-pointer block mb-2 text-gray-600 hover:text-primary"
      >
        {preview ? 'Change Image' : 'Select Input Image'}
      </label>
      
      {preview && (
        <img 
          src={preview} 
          alt="Image Preview" 
          className="max-w-xs mx-auto mb-2 rounded shadow"
        />
      )}

      {uploadStatus && (
        <div className="mt-2">
          <p className={`text-sm ${uploadStatus.includes('Error') ? 'text-error' : 'text-info'}`}>
            {uploadStatus}
          </p>
          {uploadStatus === 'Uploading...' && (
            <div className="loading loading-spinner loading-sm"></div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
```

## Complete Integration

1. Ensure your API service knows how to handle the uploaded file URL
2. Update your form submission to include the uploaded file URL
3. Make sure your backend can process the URL properly in image generation

## Troubleshooting

- Check the browser console for UploadThing errors
- Verify your API keys are correctly set
- Ensure your server routes are properly configured
- Check file size limits and permissions in your UploadThing dashboard 