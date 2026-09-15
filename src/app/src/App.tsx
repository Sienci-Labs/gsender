/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import { FocusTrappingProvider } from 'app/lib/focus-trapping';
import * as user from 'app/lib/user';
import store from 'app/store';
import { type RootState, store as reduxStore } from 'app/store/redux';
import rootSaga, { sagaMiddleware } from 'app/store/redux/sagas';
import isElectron from 'is-electron';
import { posthog } from 'posthog-js';
import { type ReactNode, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter } from 'react-router';
import { Toaster } from './components/shadcn/Sonner';
import { AccessoryConnectivityToastHost } from './features/AccessoryConnectivity/AccessoryConnectivityToastHost';
import { AccessibilitySettingsHandler } from './features/Helper/AccessibilitySettingsHandler';
import { installPluginBridgeListener } from './features/Plugins/utils/pluginBridge';
import { ReactRoutes } from './react-routes';

function FocusTrappingBridge({ children }: { children: ReactNode }) {
    const focusTrapping = useTypedSelector(
        (state: RootState) => state.preferences.accessibility.focusTrapping,
    );
    return (
        <FocusTrappingProvider value={focusTrapping}>
            {children}
        </FocusTrappingProvider>
    );
}

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

        const removePluginBridge = installPluginBridgeListener();

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
            (window as any).ipcRenderer
                .invoke('get-windows-registry')
                .then((value: boolean) => {
                    posthog.register({ isBundled: value });
                });
        }

        return () => {
            removePluginBridge();
        };
    }, []);

    return (
        <ReduxProvider store={reduxStore}>
            <FocusTrappingBridge>
                <AccessibilitySettingsHandler />
                <Toaster closeButton visibleToasts={5} />
                <AccessoryConnectivityToastHost />
                <HashRouter>
                    <ReactRoutes />
                </HashRouter>
            </FocusTrappingBridge>
        </ReduxProvider>
    );
}

export default App;
