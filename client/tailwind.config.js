/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fefce8',   // light warm yellow
          100: '#fef9c3',  // pale gold yellow
          200: '#fef08a',  // soft yellow
          300: '#fde047',  // sunshine yellow
          400: '#facc15',  // bright gold
          500: '#eab308',  // primary gold
          600: '#ca8a04',  // rich amber gold
          700: '#a16207',  // deep warm amber
          800: '#854d0e',  // dark amber
          900: '#713f12',  // deep roasted amber
          950: '#422006',  // dark chocolate amber
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
