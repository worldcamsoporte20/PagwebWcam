import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
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
      },
      boxShadow: {
        soft: "0 16px 50px rgba(23, 32, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
