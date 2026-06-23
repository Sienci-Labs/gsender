import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react';
import posthog from 'posthog-js';
import { version } from '../../package.json';

const isInDevMode = import.meta.env.MODE === 'development';
const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

if (posthogToken && posthogHost) {
    posthog.init(posthogToken, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        debug: isInDevMode,
        autocapture: false, // No need to capture everything automatically, manual events are more useful
        capture_pageview: !isInDevMode,
        capture_heatmaps: !isInDevMode,
        disable_session_recording: isInDevMode,
        opt_out_capturing_by_default: isInDevMode,
    });

    // Register properties that are added to all events
    posthog.register({
        app_version: version,
    });
} else {
    console.warn(
        'PostHog is not initialized because the app is running in development mode or the token/host are not set',
    );
}

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
