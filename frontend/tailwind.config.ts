import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui"]
      },
      colors: {
        brand: {
          50: "#eefcf9",
          100: "#cff7ef",
          500: "#14b8a6",
          600: "#0f9b8e",
          700: "#0f766e"
        }
      }
    }
  },
  plugins: []
};

export default config;
