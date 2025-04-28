# Flux API Playground (React)

A modern React-based frontend for interacting with the Flux API from fal.ai. This application provides a user-friendly interface for generating images using various Flux models, with features including image history, parameter customization, image uploading, and more.

## Features

- **Model Selection**: Choose from a comprehensive list of available Flux models
- **Image Generation**: Generate images using text prompts with customizable parameters
- **Image-to-Image Support**: Upload images for image-to-image generation with adjustable strength
- **History Management**: View, browse, and delete your generation history
- **Advanced Parameters**: Fine-tune generation with controls for dimensions, steps, seed, etc.
- **Dark/Light Mode**: Toggle between dark and light themes
- **Responsive Design**: Works on desktop and mobile devices
- **Image Modal**: View generated images in a detailed modal with metadata
- **Masonry Layout**: Beautiful grid layout for history items

## Technologies Used

- **React**: UI library for building component-based interfaces
- **Tailwind CSS**: Utility-first CSS framework
- **DaisyUI**: Component library for Tailwind CSS
- **Masonry Layout**: For beautiful, responsive image grids
- **Context API**: For state management across components

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd flux-api-playground
   ```

2. Install dependencies:
   ```bash
   cd react-app
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. The application will be available at http://localhost:3000

## Project Structure

```
react-app/
├── public/
├── src/
│   ├── components/         # React components
│   │   ├── GenerationForm.js
│   │   ├── HistoryGrid.js
│   │   ├── ImageModal.js
│   │   ├── ImageUpload.js
│   │   ├── LogsDisplay.js
│   │   ├── ModelSelector.js
│   │   └── ThemeToggle.js
│   ├── context/            # React context for state management
│   │   └── AppContext.js
│   ├── data/               # Static data
│   │   └── models.js
│   ├── services/           # API services
│   │   └── api.js
│   ├── App.js              # Main app component
│   ├── index.js            # Entry point
│   └── index.css           # Global styles with Tailwind
├── package.json
└── tailwind.config.js      # Tailwind configuration
```

## API Integration

The application is designed to work with a backend API that provides endpoints for:

- Generating images with models
- Fetching generation history
- Deleting history items
- Uploading images

The API service layer can be found in `src/services/api.js` and is designed to be easily configurable to work with different backend implementations.

## Customization

### Themes

The application uses DaisyUI themes which can be customized in the `tailwind.config.js` file.
Currently, it supports "light", "dark", and "cupcake" themes.

### API Configuration

The API base URL and endpoints can be configured in the `src/services/api.js` file.

## Build for Production

To build the application for production deployment:

```bash
npm run build
# or
yarn build
```

This will create an optimized production build in the `build` directory.

## Acknowledgements

- [fal.ai](https://fal.ai/) for providing the Flux API
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [React](https://reactjs.org/)

## License

MIT
