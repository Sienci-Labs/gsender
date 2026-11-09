import ReactDOM from 'react-dom/client';
import { initI18n, watchLanguagePreference } from './i18n';
import store, { initStore } from './store';

import './sentry-config';
import './index.css';

// Many modules read the store at import time, so settings must be loaded from
// the server before App (and everything it pulls in) is evaluated.
async function bootstrap() {
    const container = document.getElementById('app') as HTMLElement;

    await initStore();
    await initI18n(store.get('workspace.language', 'system'));
    watchLanguagePreference(store);

    const [{ default: App }, { default: PostHogConfig }] = await Promise.all([
        import('./App'),
        import('./posthog-config'),
    ]);

    // Use createRoot instead of hydrateRoot since we don't need full SSR for Electron app
    const root = ReactDOM.createRoot(container);
    root.render(
        <PostHogConfig>
            <App />
        </PostHogConfig>,
    );
}

bootstrap();
