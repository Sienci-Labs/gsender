import ReactDOM from 'react-dom/client';

import App from './App';
import PostHogConfig from './posthog-config';

import './sentry-config';
import './index.css';

// Use createRoot instead of hydrateRoot since we don't need full SSR for Electron app
const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);
root.render(
    <PostHogConfig>
        <App />
    </PostHogConfig>,
);
