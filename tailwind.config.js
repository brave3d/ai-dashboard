module.exports = {
  content: [
    "./src/**/*.{html,js}", // Adjust the path according to your project structure
    "./index.html", // Add this line to include your index.html file
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};