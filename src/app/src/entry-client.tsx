import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';

import './index.css';

import App from './App';

import './sentry-config';

// Use createRoot instead of hydrateRoot since we don't need full SSR for Electron app
const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);

root.render(
    <Sentry.ErrorBoundary
        fallback={({ error, resetError }) => (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Something went wrong</h2>
                <p>{error instanceof Error ? error.message : String(error)}</p>
                <button onClick={resetError}>Try again</button>
            </div>
        )}
        showDialog
    >
        <App />
    </Sentry.ErrorBoundary>,
);
