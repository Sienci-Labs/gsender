import ReactDOM from 'react-dom/client';

import './index.css';

import App from './App';

import './sentry-config';

import posthog from 'posthog-js';
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react';

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
});

// Use createRoot instead of hydrateRoot since we don't need full SSR for Electron app
const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);
root.render(
    <PostHogProvider client={posthog}>
        <PostHogErrorBoundary>
            <App />
        </PostHogErrorBoundary>
    </PostHogProvider>,
);
