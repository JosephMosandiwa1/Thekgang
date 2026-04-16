import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#2B2B2B',
        gold: '#C5A15A',
        'gold-light': '#D4B878',
        'gold-dark': '#A88A42',
        white: '#FFFFFF',
        cream: '#FAF8F5',
        paper: '#F5F0EB',
        gray: {
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#888888',
          600: '#525252',
          700: '#404040',
          800: '#2B2B2B',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['var(--font-hoves)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
