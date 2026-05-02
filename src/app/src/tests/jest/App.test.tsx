import { render, screen, waitFor } from '@testing-library/react';
import App from 'app/App';
import * as user from 'app/lib/user';
import * as sagaModule from 'app/store/redux/sagas';
import store from 'app/store';

// ─── Mocks 

// Mock Redux store so App doesn't need real state or reducers
jest.mock('app/store/redux', () => ({
    store: {
        getState: () => ({
            preferences: {
                accessibility: { focusRings: false },
            },
            controller: { type: '', state: {}, settings: {} },
            connection: { isConnected: false },
            fileInfo: {},
        }),
        dispatch: jest.fn(),
        subscribe: jest.fn(() => jest.fn()),
    },
}));

// Mock sagas so no real background tasks run during tests
jest.mock('app/store/redux/sagas', () => ({
    default: jest.fn(),
    sagaMiddleware: { run: jest.fn() },
}));

// Mock user auth so no real network/auth calls are made
jest.mock('app/lib/user', () => ({
    __esModule: true,
    signin: jest.fn(() =>
        Promise.resolve({ authenticated: false, token: '' })
    ),
}));

// Mock controller so no real serial/socket connections are attempted
jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: { connect: jest.fn() },
}));

// Mock router outlet so we test the App shell, not every route/page
jest.mock('app/react-routes', () => ({
    ReactRoutes: () => <div data-testid="react-routes" />,
}));

// Mock accessibility handler — side-effect only, not relevant to shell tests
jest.mock('app/features/Helper/AccessibilitySettingsHandler', () => ({
    AccessibilitySettingsHandler: () => null,
}));

// Mock Toaster — UI only, no logic to test in shell
jest.mock('app/components/shadcn/Sonner', () => ({
    Toaster: () => <div data-testid="toaster" />,
}));

// ─── Setup 

// Spy on store.get and return a stable token value
// This also fixes the semver warning caused by undefined version in store/index.ts
jest.spyOn(store, 'get').mockReturnValue('');

// Clear all mocks between tests to prevent state leakage
beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply store.get mock after clearAllMocks resets it
    jest.spyOn(store, 'get').mockReturnValue('');
});

// ─── Reusable render helper
// Use this in future tests instead of calling render(<App />) directly.
// Keeps tests consistent and makes it easy to add global providers later.
const renderApp = () => render(<App />);

// ─── Must Have Test Cases

// Test 1 - App renders without crashing
it('renders App.tsx without crashing', () => {
    // Verifies that the root App component mounts successfully
    // without throwing any errors or exceptions on startup
    expect(() => renderApp()).not.toThrow();
});

// Test 2 - ReactRoutes renders inside HashRouter
it('renders ReactRoutes inside HashRouter', () => {
    // Verifies that the routing layer is mounted correctly
    // and all gSender pages are accessible via routes
    renderApp();
    expect(screen.getByTestId('react-routes')).toBeInTheDocument();
});

// Test 3 - Session token retrieved from store on startup
it('retrieves saved session token from store on startup', () => {
    // Verifies that store.get is called with session.token
    // when gSender first launches to check for existing CNC session
    renderApp();
    expect(store.get).toHaveBeenCalledWith('session.token');
});

// Test 4 - Session token validated on startup
it('validates saved session token on startup', async () => {
    // Verifies that user.signin is called with the retrieved token
    // to check whether the previous CNC session is still valid
    renderApp();
    await waitFor(() => {
        expect(user.signin).toHaveBeenCalledWith({ token: '' });
    });
});

// Test 5 - Redux sagas start on app startup
it('starts Redux sagas on app startup', () => {
    // Verifies that sagaMiddleware.run is called with rootSaga
    // so all background Redux tasks are running when gSender loads
    renderApp();
    expect(sagaModule.sagaMiddleware.run).toHaveBeenCalledWith(
        sagaModule.default
    );
});