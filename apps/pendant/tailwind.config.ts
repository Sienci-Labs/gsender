import type { Config } from 'tailwindcss';
import path from 'path';

// Re-use the desktop's full theme (colors, screens, animations) as a preset
// so the pendant automatically picks up robin-*, dark-*, etc.
import desktopConfig from '../desktop/tailwind.config';

const root = path.resolve(__dirname, '../..');

export default {
    presets: [desktopConfig as Config],
    content: [
        path.join(__dirname, './src/**/*.{js,ts,jsx,tsx,html}'),
        path.join(__dirname, './index.html'),
        path.join(root, 'apps/desktop/src/**/*.{js,ts,jsx,tsx,html}'),
        path.join(root, 'packages/ui/src/**/*.{js,ts,jsx,tsx}'),
        path.join(root, 'packages/features/src/**/*.{js,ts,jsx,tsx}'),
        path.join(root, 'packages/controller-client/src/**/*.{js,ts,jsx,tsx}'),
    ],
    darkMode: 'class',
} satisfies Config;
