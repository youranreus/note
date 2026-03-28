/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ebff",
          500: "#1976d2",
          700: "#115293"
        }
      }
    }
  },
  plugins: []
};
