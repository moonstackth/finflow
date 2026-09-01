import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        kanit: ["Kanit", "sans-serif"]
      },
      colors: {
        cream: "#F6F1E8",
        paper: "#FFFDF8",
        ink: "#3D382F",
        muted: "#82796B",
        earth: "#8A7153",
        sage: "#718568",
        terracotta: "#A9685B",
        gold: "#B58A58"
      }
    }
  },
  plugins: []
};

export default config;
