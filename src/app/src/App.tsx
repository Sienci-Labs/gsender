import { ReactNode, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter } from 'react-router';

import { store as reduxStore, RootState } from '@gsender/controller-client/store/redux';
import { sagaMiddleware, createRootSaga } from '@gsender/controller-client/store/redux/sagas';
import * as controllerSagas from 'app/store/redux/sagas/controllerSagas';
import store from 'app/store';
import * as user from 'app/lib/user';
import controller from '@gsender/controller-client/controller';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import { FocusTrappingProvider } from '@gsender/ui/lib/focus-trapping';
import { Toaster } from '@gsender/ui/shadcn/Sonner';
import { ReactRoutes } from './react-routes';
import { AccessibilitySettingsHandler } from './features/Helper/AccessibilitySettingsHandler';

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

        sagaMiddleware.run(createRootSaga([controllerSagas]));
    }, []);

    return (
        <>
            <ReduxProvider store={reduxStore}>
                <FocusTrappingBridge>
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
                </FocusTrappingBridge>
            </ReduxProvider>
        </>
    );
}

export default App;
