import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ocean: {
          50: "#effcff",
          100: "#dff7ff",
          200: "#b8eeff",
          300: "#78ddff",
          400: "#32c8f2",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
      },
    },
  },
  plugins: [
    heroui({
      layout: {
        radius: {
          small: "0.5rem",
          medium: "0.875rem",
          large: "1.25rem",
        },
        borderWidth: {
          small: "1px",
          medium: "1px",
          large: "1px",
        },
      },
      themes: {
        light: {
          colors: {
            primary: {
              50: "#effcff",
              100: "#dff7ff",
              200: "#b8eeff",
              300: "#78ddff",
              400: "#32c8f2",
              500: "#0ea5e9",
              600: "#0284c7",
              700: "#0369a1",
              800: "#075985",
              900: "#0c4a6e",
              DEFAULT: "#0284c7",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
  ],
};

export default config;
