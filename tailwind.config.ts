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
        secondary: "#D2281F",
        gold: {
          DEFAULT: "#D2281F",
          light: "#FF6A5E",
          dark: "#B3221A",
        },
        // Gig Poster palette for the public site
        paper: "#F1ECE2",
        ink: "#141414",
        poster: {
          DEFAULT: "#D2281F",
          dark: "#B3221A",
          light: "#FF6A5E",
        },
        rule: "#CFC8BA",
        muted: "#6B665C",
      },
      fontFamily: {
        display: ["Righteous", "sans-serif"],
        body: ["Poppins", "sans-serif"],
        poster: ['"Archivo Black"', "Impact", "sans-serif"],
        archivo: ["Archivo", "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        hard: "10px 10px 0 #141414",
        "hard-red": "10px 10px 0 #D2281F",
        "hard-sm": "6px 6px 0 #141414",
      },
    },
  },
  plugins: [],
};

export default config;
