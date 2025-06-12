import ReactDOMServer from 'react-dom/server';

import App from './AppServer';

import './index.css';
import './sentry-config';

export function render() {
    const html = ReactDOMServer.renderToString(
        <>
            <App />
        </>,
    );
    return { html };
}
