/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          dark: '#0a0e1a',
          card: '#111827',
          border: '#1f2937',
          accent: '#059669', // Emerald municipal accent
          accentHover: '#10b981',
          highlight: '#38bdf8'
        }
      }
    },
  },
  plugins: [],
}
