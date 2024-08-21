import type { Config } from 'tailwindcss';

export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            animation: {
                rotato: "rotate 10s linear infinite",
            },
            keyframes: {
                rotato: {
                    "0%": {transform: "rotate(0deg) scale(10)"},
                    "100%": {transform: "rotate(-360deg) scale(5)"},
                },
            }
        }
    },
    plugins: [],
} satisfies Config;

