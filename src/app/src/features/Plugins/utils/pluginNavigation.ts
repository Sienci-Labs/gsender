import { useEffect } from 'react';
import { type NavigateFunction, useNavigate } from 'react-router';

// The plugin bridge is a plain module living outside the router, so it can't
// call useNavigate itself. A component inside <HashRouter> registers the
// router's navigate function here instead.
let navigator: NavigateFunction | null = null;

export const registerPluginNavigator = (fn: NavigateFunction): (() => void) => {
    navigator = fn;
    return () => {
        if (navigator === fn) {
            navigator = null;
        }
    };
};

// A single leading "/" only: rejects protocol-relative ("//host"), backslash
// tricks, and anything with a scheme ("http:", "javascript:").
const IN_APP_PATH = /^\/(?![/\\])/;

export const navigateForPlugin = (
    payload: Record<string, unknown> = {},
): { ok: true } => {
    const { path, replace } = payload;

    if (typeof path !== 'string' || !IN_APP_PATH.test(path)) {
        throw new Error(
            'path must be an in-app path starting with a single "/"',
        );
    }
    if (!navigator) {
        throw new Error('Navigation is not available yet');
    }

    const nav = navigator;
    // Deferred so the bridge response is posted first: navigating can unmount
    // the calling plugin's iframe before it would otherwise get its reply.
    setTimeout(() => nav(path, { replace: replace === true }), 0);

    return { ok: true };
};

export const PluginNavigationBridge = (): null => {
    const navigate = useNavigate();

    useEffect(() => registerPluginNavigator(navigate), [navigate]);

    return null;
};
