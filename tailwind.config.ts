import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "sans-serif"],
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
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(24px)",
            filter: "blur(6px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
            filter: "blur(0px)",
          },
        },
        fadeInScale: {
          "0%": { opacity: "0", transform: "scale(0.94)", filter: "blur(8px)" },
          "100%": { opacity: "1", transform: "scale(1)", filter: "blur(0px)" },
        },
        tagSwing: {
          "0%, 100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
      },
      animation: {
        wiggle: "wiggle 3.5s ease-in-out infinite",
        "fade-up": "fadeInUp 1s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-scale": "fadeInScale 1.1s cubic-bezier(0.22, 1, 0.36, 1) both",
        "tag-swing": "tagSwing 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
