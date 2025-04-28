# Setup Guide for Flux API Playground

This document provides step-by-step instructions for setting up and running the Flux API Playground application.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Flux API key from [fal.ai](https://fal.ai)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flux-api-playground.git
   cd flux-api-playground
   ```

2. Install dependencies for the React app:
   ```bash
   cd react-app
   npm install
   # or
   yarn install
   ```

3. Install dependencies for the backend server (if applicable):
   ```bash
   cd ../server
   npm install
   # or
   yarn install
   ```

## Configuration

1. Create a `.env` file in the server directory:
   ```
   PORT=5000
   FAL_KEY=your-fal-api-key
   FAL_SECRET=your-fal-secret-key
   ```

2. Configure the React app proxy (if needed):
   In `react-app/package.json`, ensure the proxy is set to your backend URL:
   ```json
   {
     "proxy": "http://localhost:5000"
   }
   ```

## Running the Application

### Development Mode

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   # or
   yarn dev
   ```

2. In a separate terminal, start the React app:
   ```bash
   cd react-app
   npm start
   # or
   yarn start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Production Build

1. Build the React app:
   ```bash
   cd react-app
   npm run build
   # or
   yarn build
   ```

2. Configure your server to serve the static files from the `react-app/build` directory.

## API Endpoints

The backend server provides the following endpoints:

- `POST /api/generate` - Generate images using Flux API
- `GET /api/history` - Get generation history
- `DELETE /api/history/:id` - Delete a history item
- `POST /api/upload` - Upload an image file

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure your backend server has proper CORS configuration enabled.

2. **API key issues**: Verify your Flux API key is correctly set in the environment variables.

3. **Proxy errors**: If you're seeing proxy errors, make sure the backend server is running on the port specified in the React app's proxy setting.

4. **Missing dependencies**: If you encounter errors about missing dependencies, try running:
   ```bash
   npm install
   # or
   yarn install
   ```

5. **Port conflicts**: If port 3000 or 5000 is already in use, you can specify a different port:
   ```bash
   # For React app
   PORT=3001 npm start
   
   # For backend server
   PORT=5001 npm run dev
   ```
   Remember to update the proxy setting in the React app if you change the backend port.

## Next Steps

After getting the application running, you might want to:

1. Customize the UI by modifying components in `react-app/src/components`
2. Add new features by extending the API services
3. Optimize performance for larger datasets
4. Add authentication for multi-user support 