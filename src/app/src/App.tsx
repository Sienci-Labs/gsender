import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter } from 'react-router';
import isElectron from 'is-electron';

import { store as reduxStore } from 'app/store/redux';
import rootSaga from 'app/store/redux/sagas';
import { sagaMiddleware } from 'app/store/redux/sagas';
import store from 'app/store';
import * as user from 'app/lib/user';
import controller from 'app/lib/controller';
import ConfirmationDialog from 'app/components/ConfirmationDialog/ConfirmationDialog';
import { initializeGlobalCameraService } from 'app/lib/camera/globalCameraService';

import { Toaster } from './components/shadcn/Sonner';
import { ReactRoutes } from './react-routes';

function App() {
    useEffect(() => {
        let isUnmounted = false;
        let handleControllerConnect: (() => void) | null = null;

        const token = store.get('session.token');
        user.signin({ token }).then((result) => {
            if (isUnmounted) {
                return;
            }

            const { authenticated, token } = result as {
                authenticated: boolean;
                token: string;
            };

            if (authenticated) {
                const host = '';
                const options = {
                    query: 'token=' + token,
                };
                // Register listener before connect to avoid missing early connect events.
                handleControllerConnect = () => {
                    // Camera source service must run only in Electron main app.
                    // Browser clients (including localhost tabs) are viewers.
                    if (isElectron()) {
                        console.log('[App] Initializing camera service on main client');
                        initializeGlobalCameraService().catch((error) => {
                            console.error('Failed to initialize camera service:', error);
                        });
                    }
                };
                controller.addListener('connect', handleControllerConnect);
                controller.connect(host, options);
                handleControllerConnect();
                
                return;
            } else {
                console.log('no auth');
            }
        });

        sagaMiddleware.run(rootSaga);

        return () => {
            isUnmounted = true;
            if (handleControllerConnect) {
                controller.removeListener('connect', handleControllerConnect);
            }
        };
    }, []);

    return (
        <>
            <ReduxProvider store={reduxStore}>
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
