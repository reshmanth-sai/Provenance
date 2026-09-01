import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#FAFAFA",
        "surface-card": "#FFFFFF",
        primary: "#1A1A1A",
        accent: {
          DEFAULT: "#1E5F74",
          hover: "#154756",
          light: "#EAF3F6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
