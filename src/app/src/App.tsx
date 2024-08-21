import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store/redux';

import { routeTree } from './routeTree.gen';

import './index.css';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

function App() {
    return (
        <>
            <ReduxProvider store={store}>
                <RouterProvider router={router} />
            </ReduxProvider>
        </>
    );
}

export default App;
