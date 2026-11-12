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
          light: "#f7f5f0", // Warm non-glare off-white/wood parchment
          dark: "#141210",  // Deep obsidian charcoal timber
        },
        surface: {
          light: "#ffffff",
          dark: "#1c1917",
        },
        subtle: {
          light: "#efeae3",
          dark: "#26221f",
        },
        border: {
          light: "#e2dacd",
          dark: "#332d27",
        },
        brand: {
          trunk: "#5c3a21",     // Primary tree trunk brown
          bark: "#3d2314",      // Deep bark
          amber: "#8c5a2b",     // Warm amber cedar
          light: "#d4a373",     // Sanded birch light accent
          parchment: "#faf7f2", // Wood pulp surface
          border: "#d8cbbe",
        },
      },
    },
  },
  plugins: [],
};

export default config;
