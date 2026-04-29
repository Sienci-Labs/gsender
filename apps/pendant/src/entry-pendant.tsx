import React from 'react';
import ReactDOM from 'react-dom/client';

function PendantPlaceholder() {
    return (
        <div
            style={{
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                background: '#0f172a',
                color: '#f1f5f9',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 16,
            }}
        >
            <h1 style={{ fontSize: 48, margin: 0 }}>gSender Pendant</h1>
            <p style={{ fontSize: 18, opacity: 0.7, margin: 0 }}>
                Placeholder — touch UI coming soon
            </p>
            <p style={{ fontSize: 12, opacity: 0.4, margin: 0 }}>
                Served from gSender at {window.location.host}
            </p>
        </div>
    );
}

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(<PendantPlaceholder />);
}
