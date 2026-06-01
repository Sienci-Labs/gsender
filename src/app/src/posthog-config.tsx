import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react';
import posthog from 'posthog-js';
import { version } from '../../package.json';

const isInDevMode = import.meta.env.MODE === 'development';
const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

posthog.init(posthogToken, {
    api_host: posthogHost,
    person_profiles: 'identified_only',
});

// Register properties that are added to all events
posthog.register({
    app_version: version,
});

posthog.on('eventCaptured', (payload) => {
    // PostHog auto-captured events always start with "$"
    if (payload.event && !payload.event.startsWith('$')) {
        console.log('Manual PostHog Event:', payload.event, payload);
    }
});

// if (!isInDevMode && posthogToken && posthogHost) {
//     posthog.init(posthogToken, {
//         api_host: posthogHost,
//         person_profiles: 'identified_only',
//     });

//     // Register properties that are added to all events
//     posthog.register({
//         app_version: version,
//     });

//     posthog.debug(true);
// } else {
//     console.warn(
//         'PostHog is not initialized because the app is running in development mode or the token/host are not set',
//     );
// }

const PostHogConfig = ({ children }: { children: React.ReactNode }) => {
    if (isInDevMode || !posthogToken || !posthogHost) {
        return <>{children}</>;
    }

    return (
        <PostHogProvider client={posthog}>
            <PostHogErrorBoundary>{children}</PostHogErrorBoundary>
        </PostHogProvider>
    );
};

export default PostHogConfig;
