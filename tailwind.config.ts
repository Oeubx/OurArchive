import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ao3: {
          red: "#990000",
          darkred: "#700000",
          light: "#f7f7f7",
          border: "#dcdcdc",
        },
      },
    },
  },
  plugins: [],
};

export default config;
