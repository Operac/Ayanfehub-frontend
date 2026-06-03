/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#6D9773",
        "accent-gold": "#BB8A52",
        "background-light": "#F9FAF9",
        "background-dark": "#0C3B2E",
      },
      fontFamily: {
        "sans": ["Manrope", "sans-serif"],
        "display": ["Manrope", "sans-serif"]
      },
    },
  },
  plugins: [],
}
