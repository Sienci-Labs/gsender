import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const { screens } = defaultTheme;
const screensWithoutXl = {
    sm: screens.sm,
    md: screens.md,
    lg: screens.lg,
    '2xl': screens['2xl'],
};

function customScreenVariants({
    addVariant,
}: {
    addVariant: (name: string, value: string | string[]) => void;
}) {
    addVariant('xl', '@media (min-width: 1280px) { & }');
    addVariant(
        'max-xl',
        '@media (max-width: 1280px), (max-height: 880px) { & }',
    );
    addVariant('short', '@media (max-height: 820px) { & }');
    addVariant('portrait', '@media (orientation: portrait) { & }');
    addVariant('landscape', '@media (orientation: landscape) { & }');
}

export default {
    content: [
        './src/**/*.{js,ts,jsx,tsx,html}',
        './index.html',
        '!**/node_modules/**',
    ],
    important: true,
    darkMode: 'class',
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
        screens: {
            ...screensWithoutXl,
        },
        extend: {
            transitionProperty: {
                width: 'width',
            },
            height: {
                'content-area': 'calc(100vh-64px)',
            },
            colors: {
                // Workshop High-Contrast dark theme — compat `dark` family remapped
                // to Workshop neutrals so existing `dark:bg-dark*` usages pick up the
                // new palette. Prefer the semantic surface/content/outline tokens below
                // for new code (see docs/dark-mode-theme-instructions.md).
                dark: {
                    DEFAULT: '#151B23',
                    darker: '#090D12',
                    lighter: '#202832',
                },
                // Workshop semantic neutrals (single source of truth; pendant inherits
                // these via `presets: [desktopConfig]`).
                surface: {
                    base: '#151B23',
                    sunken: '#090D12',
                    raised: '#202832',
                    elevated: '#2D3946',
                    hover: '#3A4857',
                    active: '#445261',
                    disabled: '#252D36',
                },
                content: {
                    primary: '#F4F7FA',
                    secondary: '#CFD6DF',
                    muted: '#A0AABA',
                    disabled: '#778291',
                    inverse: '#151B23',
                },
                outline: {
                    subtle: '#3F4B59',
                    DEFAULT: '#59687B',
                    strong: '#72849D',
                    disabled: '#3A444F',
                },
                overlay: {
                    hover: 'rgba(255, 255, 255, 0.07)',
                    active: 'rgba(255, 255, 255, 0.12)',
                    disabled: 'rgba(0, 0, 0, 0.20)',
                    scrim: 'rgba(0, 0, 0, 0.72)',
                },
                // shadcn/ui primitive tokens (src/components/shadcn/*) — resolved
                // from CSS vars (see index.css) so bare classes like `bg-card` and
                // `border` pick up the Workshop theme without a dark: prefix.
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
                },
                popover: {
                    DEFAULT: 'var(--popover)',
                    foreground: 'var(--popover-foreground)',
                },
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                destructive: {
                    DEFAULT: 'var(--destructive)',
                    foreground: 'var(--destructive-foreground)',
                },
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
                robin: {
                    50: '#f6f9fc',
                    100: '#ecf2f8',
                    200: '#c7d9eb',
                    300: '#a1c0dd',
                    400: '#7ca7d0',
                    500: '#689AC9',
                    600: '#568ec3',
                    700: '#3c74a9',
                    800: '#2f5b83',
                    900: '#22415e',
                    950: '#142738',
                },
                blue: {
                    50: '#9fc2e3',
                    100: '#8cb6dd',
                    200: '#79aad8',
                    300: '#659dd2',
                    400: '#5291cd',
                    500: '#3F85C7',
                    600: '#3978b3',
                    700: '#2c5d8b',
                    800: '#265077',
                    900: '#204364',
                    950: '#193550',
                },
                red: {
                    50: '#ee9393',
                    100: '#ea7d7d',
                    200: '#e76767',
                    300: '#e35151',
                    400: '#e03c3c',
                    500: '#dc2626',
                    600: '#c62222',
                    700: '#b01e1e',
                    800: '#9a1b1b',
                    900: '#841717',
                    950: '#6e1313',
                },
                green: {
                    50: '#82cbb4',
                    100: '#69c0a5',
                    200: '#50b696',
                    300: '#37ab87',
                    400: '#1ea178',
                    500: '#059669',
                    600: '#05875f',
                    700: '#047854',
                    800: '#04694a',
                    900: '#035a3f',
                    950: '#034b35',
                },
                orange: {
                    50: '#ddb586',
                    100: '#d6a66d',
                    200: '#cf9755',
                    300: '#c9883d',
                    400: '#c27924',
                    500: '#bb6a0c',
                    600: '#a85f0b',
                    700: '#96550a',
                    800: '#834a08',
                    900: '#704007',
                    950: '#5e3506',
                },
                teal: {
                    50: '#E1F5EE',
                    100: '#9FE1CB',
                    200: '#5DCAA5',
                    600: '#0F6E56',
                },
                purple: {
                    50: '#EEEDFE',
                    100: '#CECBF6',
                    200: '#AFA9EC',
                    400: '#7F77DD',
                    600: '#534AB7',
                },
            },
            borderColor: {
                DEFAULT: 'var(--border)',
            },
            ringColor: {
                DEFAULT: 'var(--ring)',
            },
            ringOffsetColor: {
                background: 'var(--background)',
            },
            keyframes: {
                attention: {
                    '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                    '25%': { transform: 'translate(5px, 5px) rotate(5deg)' },
                    '50%': { transform: 'translate(0, 0) rotate(0eg)' },
                    '75%': { transform: 'translate(-5px, 5px) rotate(-5deg)' },
                    '100%': { transform: 'translate(0, 0) rotate(0deg)' },
                },
                rotate: {
                    '0%': { transform: 'rotate(0deg) scale(10)' },
                    '100%': { transform: 'rotate(-360deg) scale(10)' },
                },
                rotatef: {
                    '0%': { transform: 'rotate(0deg) scale(10)' },
                    '100%': { transform: 'rotate(360deg) scale(10)' },
                },
                rotater: {
                    '0%': { transform: 'rotate(0deg) scale(10)' },
                    '100%': { transform: 'rotate(-360deg) scale(10)' },
                },
                glowPulse: {
                    '0%, 100%': {
                        boxShadow: '0 0 5px rgba(104, 154, 201, 0.5)',
                    },
                    '50%': {
                        boxShadow: '0 0 10px rgba(104, 154, 201, 1)',
                    },
                },
                glowPacity: {
                    '0%, 100%': {
                        opacity: '0.5',
                    },
                    '50%': {
                        opacity: '1',
                    },
                },
            },
            animation: {
                attention: 'attention 1s ease-in-out infinite',
                gradient: 'gradient-shift 15s ease infinite',
                rotate: 'rotate 1s linear infinite',
                rotatef: 'rotatef 1s linear infinite',
                rotater: 'rotater 1s linear infinite',
                glowPulse: 'glowPulse 1.5s ease-in-out infinite',
                glowPacity: 'glowPacity 1.5s ease-in-out infinite',
            },
        },
    },
    plugins: [require('tailwindcss-animate'), customScreenVariants],
} satisfies Config;
