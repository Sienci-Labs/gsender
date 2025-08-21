import { createLazyFileRoute } from '@tanstack/react-router';

import JointerTool from 'app/features/Jointer';
import Page from 'app/components/Page';

export const Route = createLazyFileRoute('/jointer')({
    component: Jointer,
});

function Jointer() {
    return (
        <Page title="Jointer Tool">
            <JointerTool />
        </Page>
    );
}