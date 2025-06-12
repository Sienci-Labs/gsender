import ReactDOM from 'react-dom/client';

import './index.css';

import App from './App';

import './sentry-config';

ReactDOM.hydrateRoot(
    document.getElementById('app') as HTMLElement,
    <>
        <App />
    </>,
);
