import { setApiBaseURL } from 'app/api';
import controller from 'app/lib/controller';
import { initStore } from 'app/store';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { getHost } from './electron-bridge';

import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';
import './index.css';

async function bootstrap() {
    // In Electron, getHost() returns the embedded server's host.
    // In a browser, fall back to same-origin (connects to whatever served this page).
    const storedHost = await getHost();
    const host = storedHost ? `http://${storedHost}` : '';

    // The pendant page is file:// in Electron, so API calls need the absolute host.
    setApiBaseURL(host);

    // Modules below read the store at import time, so load settings first.
    await initStore();

    const [
        { Provider: ReduxProvider },
        { FocusTrappingProvider },
        { store: reduxStore },
        { sagaMiddleware },
        { default: PendantShell },
        pendantSagas,
    ] = await Promise.all([
        import('react-redux'),
        import('app/lib/focus-trapping'),
        import('app/store/redux'),
        import('app/store/redux/sagas'),
        import('./PendantShell'),
        import('./pendant-sagas'),
    ]);

    sagaMiddleware.run(pendantSagas.initialize);

    controller.connect(host, { query: 'token=' });

    const root = document.getElementById('root');
    if (!root) return;

    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <ReduxProvider store={reduxStore}>
                <FocusTrappingProvider value={true}>
                    <PendantShell />
                </FocusTrappingProvider>
            </ReduxProvider>
        </React.StrictMode>,
    );
}

bootstrap();
