import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Provider as ReduxProvider } from 'react-redux';
import { store as reduxStore } from 'store/redux';
import rootSaga from 'store/redux/sagas';
import { sagaMiddleware } from 'store/redux/sagas';
import store from 'store';
import * as user from 'lib/user';

import { routeTree } from './routeTree.gen';
import { useEffect } from 'react';
import controller from 'lib/controller';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

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
                controller.connect(host, options, () => {
                    // @see "src/web/containers/Login/Login.jsx"
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
                <RouterProvider router={router} />
            </ReduxProvider>
        </>
    );
}

export default App;
