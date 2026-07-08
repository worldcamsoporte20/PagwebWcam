import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        steel: "#52616B",
        mint: "#1F9D8A",
        amber: "#D88921",
        coral: "#D95D55",
        cloud: "#F5F7F8",
        wc: {
          white: "#FCFCFD",
          "blue-primary": "#022C96",
          "blue-deep": "#012477",
          "blue-medium": "#1E49A2",
          "blue-bright": "#2D70CF",
          red: "#F00922",
          "gray-cold": "#CBC9D4",
          charcoal: "#12141A",
        },
      },
      boxShadow: {
        soft: "0 16px 50px rgba(23, 32, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
