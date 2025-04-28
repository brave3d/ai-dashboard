/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan React component files
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'), // Add DaisyUI plugin
  ],
  // Optional: DaisyUI configuration
  daisyui: {
    themes: ["light", "dark", "cupcake"], // Include desired themes
  },
}

