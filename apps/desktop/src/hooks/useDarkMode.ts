import { useEffect } from 'react';

import { useWorkspaceState } from './useWorkspaceState';

export const useDarkMode = () => {
    const { enableDarkMode = false } = useWorkspaceState();

    useEffect(() => {
        if (enableDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [enableDarkMode]);
};
