/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        aicte: {
          blue: '#1d4ed8',
          accent: '#0284c7',
          dark: '#0f172a',
          light: '#f8fafc',
        },
        darkcard: '#1e293b',
        darkbg: '#0b1329',
        darkborder: '#334155',
      }
    },
  },
  plugins: [],
}
