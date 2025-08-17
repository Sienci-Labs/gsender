import * as Sentry from '@sentry/react';
import process from 'process';
import pkg from '../package.json';

const env = process.env
if (env.NODE_ENV === 'production') {
    Sentry.init({
        dsn: 'https://eeb4899f0415aa6bc9de477a7faeb720@o558751.ingest.us.sentry.io/4509479105986560',
        sendDefaultPii: true,
        release: pkg.version,
    });
}


/*Sentry.init({
    dsn: env.SENTRY_DSN,
    sendDefaultPii: true,
    release: pkg.version,
});*/
