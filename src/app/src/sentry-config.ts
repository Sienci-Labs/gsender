import * as Sentry from '@sentry/react';
import pkg from '../package.json';

Sentry.init({
    dsn: 'https://eeb4899f0415aa6bc9de477a7faeb720@o558751.ingest.us.sentry.io/4509479105986560',
    environment: process.env.NODE_ENV || 'development',
    sendDefaultPii: true,
    release: pkg.version,
    debug: process.env.NODE_ENV === 'development',
    // Enable performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Enable session replay in development for debugging
    replaysSessionSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
        // Log to console in development for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('Sentry Event:', event);
            console.log('Sentry Hint:', hint);
        }
        return event;
    },
});
