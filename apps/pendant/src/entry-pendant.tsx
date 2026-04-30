import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';

import { store as reduxStore } from '@gsender/controller-client/store/redux';
import { sagaMiddleware, createRootSaga } from '@gsender/controller-client/store/redux/sagas';
import controller from '@gsender/controller-client/controller';
import { FocusTrappingProvider } from '@gsender/ui/lib/focus-trapping';
import { getHost } from './tauri-bridge';
import * as pendantSagas from './pendant-sagas';
import PendantShell from './PendantShell';

import './index.css';

sagaMiddleware.run(createRootSaga([pendantSagas]));

async function bootstrap() {
    // In Tauri, getHost() returns the stored gSender host.
    // In a browser, fall back to same-origin (connects to whatever served this page).
    const storedHost = await getHost();
    const host = storedHost ? `http://${storedHost}` : '';

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
