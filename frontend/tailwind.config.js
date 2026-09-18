/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          darkest: '#050b14',
          navy: '#0a192f',
          surface: '#0f2444',
          card: '#132d56',
          border: '#1f3e72',
          gold: '#eab308',
          goldLight: '#fde047',
          blue: '#3b82f6',
          accent: '#0284c7',
          crimson: '#e11d48',
          success: '#10b981',
          warning: '#f59e0b',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
