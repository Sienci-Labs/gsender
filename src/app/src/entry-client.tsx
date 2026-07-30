import ReactDOM from 'react-dom/client';

import './index.css';

import App from './App';

import './sentry-config';

// Use createRoot instead of hydrateRoot since we don't need full SSR for Electron app
const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);
root.render(
    <>
        <App />
    </>,
);
