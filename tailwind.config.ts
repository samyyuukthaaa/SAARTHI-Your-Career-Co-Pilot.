import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F6F5",
        mist: "#E2E9E7",
        line: "#CFD9D6",
        ink: { DEFAULT: "#14212B", soft: "#4A5A64", faint: "#7D8B92" },
        peacock: { DEFAULT: "#0F5C6E", deep: "#0A3F4C", wash: "#DCEBEE" },
        marigold: { DEFAULT: "#E9A23B", deep: "#B9781B", wash: "#FBEBD2" },
        leaf: { DEFAULT: "#3E8E63", wash: "#DDEEE3" },
        brick: { DEFAULT: "#B4473A", wash: "#F5DEDA" },
      },
      fontFamily: {
        display: ['"Anek Latin"', '"Anek Devanagari"', "system-ui", "sans-serif"],
        body: ["Mukta", '"Anek Devanagari"', "system-ui", "sans-serif"],
      },
      borderRadius: { tile: "14px", pill: "999px" },
      keyframes: {
        talk: { "0%,100%": { transform: "scaleY(0.25)" }, "50%": { transform: "scaleY(1)" } },
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { talk: "talk 0.28s ease-in-out infinite", rise: "rise 0.5s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
