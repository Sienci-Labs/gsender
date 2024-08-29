import type { Config } from 'tailwindcss';

export default {
    content: [
        './index.html',
        './src/**/*.{html,js,ts,jsx,tsx}',
    ],
    theme: {
        colors: {
            steel: {
                50: '#f6f9fc',
                100: '#ecf2f8',
                200: '#c7d9eb',
                300: '#a1c0dd',
                400: '#7ca7d0',
                500: '#689AC9',
                600: '#568ec3',
                700: '#3c74a9',
                800: '#2f5b83',
                900: '#22415e'
            }
        },
    },
    plugins: [],
} satisfies Config;

