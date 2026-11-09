import path from 'path';
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

// Re-use the desktop's full theme (colors, screens, animations) as a preset
// so the pendant automatically picks up robin-*, dark-*, etc.
import desktopConfig from '../app/tailwind.config';

const root = path.resolve(__dirname, '../..');

export default {
    presets: [desktopConfig as Config],
    content: [
        path.join(__dirname, './src/**/*.{js,ts,jsx,tsx,html}'),
        path.join(__dirname, './index.html'),
        path.join(root, 'src/app/src/**/*.{js,ts,jsx,tsx,html}'),
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // Pendant-only tokens used by the carve screen redesign
            // (see CARVE_REDESIGN_SPEC.md §2). Not added to the desktop preset.
            colors: {
                state: {
                    idle: '#6b7280',
                    run: '#059669',
                    hold: '#ca8a04',
                    alarm: '#dc2626',
                    pause: '#ea580c',
                    tool: '#534ab7',
                },
                axis: {
                    x: '#e03c3c',
                    y: '#1ea178',
                    z: '#5291cd',
                    a: '#6d64d0',
                },
                action: {
                    unlock: '#f59e0b',
                    stop: '#c62222',
                },
                laser: '#5c52cb',
            },
            // Bundled via @fontsource in entry-pendant.tsx
            fontFamily: {
                sans: ['"IBM Plex Sans"', ...defaultTheme.fontFamily.sans],
                mono: ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono],
            },
        },
    },
} satisfies Config;
