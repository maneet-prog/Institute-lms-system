import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui"]
      },
      colors: {
        brand: {
          50: "#ecfdf3",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857"
        }
      }
    }
  },
  plugins: []
};

export default config;
