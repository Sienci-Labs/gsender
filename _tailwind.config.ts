import type { Config } from 'tailwindcss';

export default {
    content: [
        './src/app/index.html',
        './src/app/src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            animation: {
                rotato: "rotate 10s linear infinite",
            },
            keyframes: {
                rotato: {
                    "0%": {transform: "rotate(0deg) scale(10)"},
                    "100%": {transform: "rotate(-360deg) scale(10)"},
                },
            }
        }
    },
    plugins: [],
} satisfies Config;

