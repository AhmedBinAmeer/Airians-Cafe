/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef3ff",
          100: "#d8e4ff",
          500: "#1f4b99",
          700: "#122a55",
          800: "#0b1d3a",
          900: "#07142b",
          950: "#040b1a"
        },
        saffron: "#f7b32b",
        mint: "#36c98e",
        coral: "#f26d5b"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(4, 11, 26, 0.18)"
      }
    }
  },
  plugins: []
};
