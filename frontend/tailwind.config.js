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
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#2563eb', // Solid municipal civic blue
          accentHover: '#1d4ed8',
          highlight: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
}
