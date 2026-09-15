import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { type RefObject, useEffect } from 'react';

const applyTheme = (doc: Document | null | undefined, dark: boolean) => {
    const root = doc?.documentElement;
    if (!root) {
        return;
    }
    root.classList.toggle('dark', dark);
    if (dark) {
        root.dataset.darkTheme = 'workshop';
    } else {
        delete root.dataset.darkTheme;
    }
    root.style.colorScheme = dark ? 'dark' : 'light';
};

export const usePluginIframeTheme = (
    iframeRef: RefObject<HTMLIFrameElement | null>,
    syncKey?: string | number | boolean,
) => {
    const { enableDarkMode = false } = useWorkspaceState();

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) {
            return;
        }

        const apply = () => {
            try {
                applyTheme(iframe.contentDocument, enableDarkMode);
            } catch {}
        };

        apply();
        iframe.addEventListener('load', apply);
        return () => iframe.removeEventListener('load', apply);
    }, [enableDarkMode, iframeRef, syncKey]);
};
