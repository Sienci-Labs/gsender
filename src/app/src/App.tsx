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
        const token = store.get('session.token');
        user.signin({ token }).then((result) => {
            const { authenticated, token } = result as {
                authenticated: boolean;
                token: string;
            };

            if (authenticated) {
                const host = '';
                const options = {
                    query: 'token=' + token,
                };
                controller.connect(host, options);
                
                // Initialize camera service after controller connection (only on main client)
                controller.addListener('connect', () => {
                    // Main client check: Either Electron app OR localhost browser
                    // Remote clients are browser-based connections to external servers
                    const isMainClient = isElectron() || 
                                        window.location.hostname === 'localhost' || 
                                        window.location.hostname === '127.0.0.1' ||
                                        window.location.hostname === '0.0.0.0';
                    
                    if (isMainClient) {
                        console.log('[App] Initializing camera service on main client');
                        initializeGlobalCameraService().catch((error) => {
                            console.error('Failed to initialize camera service:', error);
                        });
                    }
                });
                
                return;
            } else {
                console.log('no auth');
            }
        });

        sagaMiddleware.run(rootSaga);
    }, []);

    return (
        <>
            <ReduxProvider store={reduxStore}>
                <ConfirmationDialog />
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
