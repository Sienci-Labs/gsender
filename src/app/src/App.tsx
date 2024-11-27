import { useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { Provider as ReduxProvider } from 'react-redux';

import { store as reduxStore } from 'app/store/redux';
import rootSaga from 'app/store/redux/sagas';
import { sagaMiddleware } from 'app/store/redux/sagas';
import store from 'app/store';
import * as user from 'app/lib/user';
import controller from 'app/lib/controller';
import ConfirmationDialog from 'app/components/ConfirmationDialog/ConfirmationDialog';
import { createRouter } from './router';
import { Toaster } from './components/shadcn/Sonner';

const router = createRouter();

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
                <ConfirmationDialog />
                <Toaster
                    richColors
                    closeButton
                    theme="light"
                    visibleToasts={5}
                />
                <RouterProvider router={router} />
            </ReduxProvider>
        </>
    );
}

export default App;
