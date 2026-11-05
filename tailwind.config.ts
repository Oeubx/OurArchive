import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: "#f6f6f4", // Warm non-glare off-white/parchment
          dark: "#121214",  // Deep obsidian graphite
        },
        surface: {
          light: "#ffffff",
          dark: "#1a1a1e",
        },
        subtle: {
          light: "#ededeb",
          dark: "#222228",
        },
        border: {
          light: "#e5e5e0",
          dark: "#2a2a30",
        },
        ao3: {
          red: "#990000",
          darkred: "#700000",
          lightred: "#c93b3b",
          light: "#f7f7f7",
          border: "#dcdcdc",
        },
      },
    },
  },
  plugins: [],
};

export default config;
