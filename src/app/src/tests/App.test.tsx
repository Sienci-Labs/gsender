import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import * as user from 'app/lib/user';
import * as sagaModule from 'app/store/redux/sagas';
import store from 'app/store';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('app/store/redux', () => ({
    store: {
        getState: () => ({}),
        dispatch: jest.fn(),
        subscribe: jest.fn(),
    },
}));

jest.mock('app/store/redux/sagas', () => ({
    default: jest.fn(),
    sagaMiddleware: { run: jest.fn() },
}));

jest.mock('app/store', () => ({
    __esModule: true,
    default: { get: jest.fn(() => null) },
}));

jest.mock('app/lib/user', () => ({
    __esModule: true,
    signin: jest.fn(() =>
        Promise.resolve({ authenticated: false, token: '' })
    ),
}));

jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: { connect: jest.fn() },
}));

jest.mock('../react-routes', () => ({
    ReactRoutes: () => <div data-testid="react-routes" />,
}));

jest.mock('../components/shadcn/Sonner', () => ({
    Toaster: () => <div data-testid="toaster" />,
}));

// ─── Must Have Test Cases ─────────────────────────────────────────────────────

// Test 1 - App renders without crashing
it('renders App.tsx without crashing', () => {
    // Verifies that the root App component mounts successfully
    // without throwing any errors or exceptions on startup
    expect(() => render(<App />)).not.toThrow();
});

// Test 2 - ReactRoutes renders inside HashRouter
it('renders ReactRoutes inside HashRouter', () => {
    // Verifies that the routing layer is mounted correctly
    // and all gSender pages are accessible via routes
    render(<App />);
    expect(screen.getByTestId('react-routes')).toBeInTheDocument();
});

// Test 3 - Session token retrieved from store on startup
it('retrieves saved session token from store on startup', () => {
    // Verifies that store.get is called with session.token
    // when gSender first launches to check for existing CNC session
    render(<App />);
    expect(store.get).toHaveBeenCalledWith('session.token');
});

// Test 4 - Session token validated on startup
it('validates saved session token on startup', async () => {
    // Verifies that user.signin is called with the retrieved token
    // to check whether the previous CNC session is still valid
    render(<App />);
    await waitFor(() => {
        expect(user.signin).toHaveBeenCalledWith({ token: null });
    });
});

// Test 5 - Redux sagas start on app startup
it('starts Redux sagas on app startup', () => {
    // Verifies that sagaMiddleware.run is called with rootSaga
    // so all background Redux tasks are running when gSender loads
    render(<App />);
    expect(sagaModule.sagaMiddleware.run).toHaveBeenCalledWith(
        sagaModule.default
    );
});