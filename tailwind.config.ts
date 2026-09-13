import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sgkara)", "sans-serif"],
        heading: ["var(--font-molsaq-arabic)", "sans-serif"],
      },
      colors: {
        cream: "#FDF8F3",
        caramel: "#C68B59",
        cocoa: "#5B3A29",
        berry: "#B23A48",
        pistachio: "#7B9E5B",

        qandek: {
          peach: "#F9B5A7",
          pink: "#F8C8D8",
          strawberry: "#E85D75",
          cream: "#FFF6ED",
          milk: "#FFFCF9",
          brown: "#5A3E36",
          brownLight: "#8A655A",
        },
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-8deg)" },
          "75%": { transform: "rotate(8deg)" },
        },
      },
      animation: {
        wiggle: "wiggle 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
