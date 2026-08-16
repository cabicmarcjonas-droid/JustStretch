// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx,css}"   // ✅ includes JSX + CSS files
  ],
  theme: {
    extend: {
      colors: {
        brandBlue: "#1e40af",
        brandGreen: "#16a34a",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
