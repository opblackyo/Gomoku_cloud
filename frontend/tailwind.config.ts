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
        // 五子棋主題配色
        board: {
          light: "#DEB887",
          dark: "#8B4513",
          line: "#000000",
        },
        stone: {
          black: "#1a1a1a",
          white: "#fafafa",
        },
        rank: {
          bronze: "#CD7F32",
          silver: "#C0C0C0",
          gold: "#FFD700",
          platinum: "#E5E4E2",
          diamond: "#B9F2FF",
          master: "#FF4500",
          apex: "#9400D3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
