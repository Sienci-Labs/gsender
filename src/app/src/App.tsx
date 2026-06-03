import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter } from 'react-router';

import { store as reduxStore } from 'app/store/redux';
import rootSaga from 'app/store/redux/sagas';
import { sagaMiddleware } from 'app/store/redux/sagas';
import store from 'app/store';
import * as user from 'app/lib/user';
import controller from 'app/lib/controller';
import { Toaster } from './components/shadcn/Sonner';
import { ReactRoutes } from './react-routes';
import { AccessibilitySettingsHandler } from './features/Helper/AccessibilitySettingsHandler';
import { posthog } from 'posthog-js';
import isElectron from 'is-electron';

function App() {
    useEffect(() => {
        const token = store.get('session.token');
        user.signin({ token }).then((result) => {
            const { authenticated, token } = result as {
                authenticated: boolean;
                token: string;
            };

            if (!authenticated) return;

            const host = '';
            const options = { query: 'token=' + token };

            controller.connect(host, options);
        });

        sagaMiddleware.run(rootSaga);

        const shouldSendUsageData = store.get(
            'workspace.collectUsageDataStatus',
            'pending',
        );

        if (shouldSendUsageData === 'accepted') {
            console.log('Collecting usage data through PostHog');
            posthog.opt_in_capturing();
        } else {
            posthog.opt_out_capturing();
        }

        if (isElectron()) {
            console.log('Getting windows registry');
            window.ipcRenderer.invoke('get-windows-registry').then((value: boolean) => {
                posthog.register({ isBundled: value });
            });
        }
    }, []);

    return (
        <>
            <ReduxProvider store={reduxStore}>
                <AccessibilitySettingsHandler />
                <Toaster
                    richColors
                    closeButton
                    theme="light"
                    visibleToasts={5}
                />
                <HashRouter>
                    <ReactRoutes />
                </HashRouter>
            </ReduxProvider>
        </>
    );
}

export default App;
