import { useEffect } from 'react';

import { useWorkspaceState } from './useWorkspaceState';

export const useDarkMode = () => {
    const { enableDarkMode = false } = useWorkspaceState();

    useEffect(() => {
        if (enableDarkMode) {
            document.documentElement.classList.add('dark');
            // Identifies which dark treatment is active. Currently always the
            // Workshop High-Contrast theme; the `.dark` class still indicates
            // that dark mode is enabled. See docs/dark-mode-theme-instructions.md.
            document.documentElement.dataset.darkTheme = 'workshop';
        } else {
            document.documentElement.classList.remove('dark');
            delete document.documentElement.dataset.darkTheme;
        }
    }, [enableDarkMode]);
};
