import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter } from 'react-router';

import { store as reduxStore } from 'app/store/redux';
import rootSaga from 'app/store/redux/sagas';
import { sagaMiddleware } from 'app/store/redux/sagas';
import store from 'app/store';
import * as user from 'app/lib/user';
import controller from 'app/lib/controller';
import ConfirmationDialog from 'app/components/ConfirmationDialog/ConfirmationDialog';

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
