/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyphirePink: "#b639b6",
        cyphirePurple: "#6d28d9",
        cyphireDark: "#1e1b4b",
      },
    },
  },
  plugins: [],
}
