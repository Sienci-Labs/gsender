import type { Config } from 'tailwindcss';

export default {
    content: [
        './src/app/index.html',
        './src/app/src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
} satisfies Config;

