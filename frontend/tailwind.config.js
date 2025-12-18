/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        calmBlue: "#C8E7F2",
        calmMint: "#DFF5E8",
        calmPink: "#FCE4EC",
        calmBeige: "#FFF9C4",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
