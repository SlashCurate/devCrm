/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#fdf2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#b77a6f",
          500: "#9e3028",
          600: "#7a1d16",
          700: "#650C08",
          800: "#4f0a06",
          900: "#2c0504",
        },
      },
    },
  },
  plugins: [],
};