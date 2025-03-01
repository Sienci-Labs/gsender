import ReactDOMServer from 'react-dom/server';

import App from './AppServer';
import './index.css';

export function render() {
    const html = ReactDOMServer.renderToString(
        <>
            <App />
        </>,
    );
    return { html };
}
