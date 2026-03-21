import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#FFD700",
        gold: {
          DEFAULT: "#FFD700",
          light: "#FFED4E",
          dark: "#D4AF37",
        },
      },
      fontFamily: {
        display: ["Righteous", "sans-serif"],
        body: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

