import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./index.html",
    "!**/node_modules/**",
  ],
  important: true,
  darkMode: "class",
  /*
  purge: {
    enabled: false,
  },
  safelist: [
    {
      pattern: /./, // the "." means "everything"
    },
  ],*/
  theme: {
    extend: {
      transitionProperty: {
        width: "width",
      },
      height: {
        "content-area": "calc(100vh-64px)",
      },
      colors: {
        dark: {
          DEFAULT: "#0f172a",
          darker: "#020617",
          lighter: "#334155",
        },
        robin: {
          50: "#f6f9fc",
          100: "#ecf2f8",
          200: "#c7d9eb",
          300: "#a1c0dd",
          400: "#7ca7d0",
          500: "#689AC9",
          600: "#568ec3",
          700: "#3c74a9",
          800: "#2f5b83",
          900: "#22415e",
          950: "#142738",
        },
        blue: {
          50: "#9fc2e3",
          100: "#8cb6dd",
          200: "#79aad8",
          300: "#659dd2",
          400: "#5291cd",
          500: "#3F85C7",
          600: "#3978b3",
          700: "#2c5d8b",
          800: "#265077",
          900: "#204364",
          950: "#193550",
        },
        red: {
          50: "#ee9393",
          100: "#ea7d7d",
          200: "#e76767",
          300: "#e35151",
          400: "#e03c3c",
          500: "#dc2626",
          600: "#c62222",
          700: "#b01e1e",
          800: "#9a1b1b",
          900: "#841717",
          950: "#6e1313",
        },
        green: {
          50: "#82cbb4",
          100: "#69c0a5",
          200: "#50b696",
          300: "#37ab87",
          400: "#1ea178",
          500: "#059669",
          600: "#05875f",
          700: "#047854",
          800: "#04694a",
          900: "#035a3f",
          950: "#034b35",
        },
        orange: {
          50: "#ddb586",
          100: "#d6a66d",
          200: "#cf9755",
          300: "#c9883d",
          400: "#c27924",
          500: "#bb6a0c",
          600: "#a85f0b",
          700: "#96550a",
          800: "#834a08",
          900: "#704007",
          950: "#5e3506",
        },
      },
      keyframes: {
        attention: {
          "0%": { transform: "translate(0, 0) rotate(0deg)" },
          "25%": { transform: "translate(5px, 5px) rotate(5deg)" },
          "50%": { transform: "translate(0, 0) rotate(0eg)" },
          "75%": { transform: "translate(-5px, 5px) rotate(-5deg)" },
          "100%": { transform: "translate(0, 0) rotate(0deg)" },
        },
        rotate: {
          "0%": { transform: "rotate(0deg) scale(10)" },
          "100%": { transform: "rotate(-360deg) scale(10)" },
        },
      },
      animation: {
        attention: "attention 1s ease-in-out infinite",
        gradient: "gradient-shift 15s ease infinite",
        rotate: "rotate 1s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
