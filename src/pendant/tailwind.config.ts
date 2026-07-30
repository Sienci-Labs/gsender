import type { Config } from 'tailwindcss';
import path from 'path';

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
} satisfies Config;
