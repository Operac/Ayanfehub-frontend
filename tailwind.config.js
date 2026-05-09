/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#008577",
        "accent-gold": "#B8860B",
        "background-light": "#f7f7f7",
        "background-dark": "#1f1f1f",
      },
      fontFamily: {
        "sans": ["Manrope", "sans-serif"],
        "display": ["Manrope", "sans-serif"]
      },
    },
  },
  plugins: [],
}
