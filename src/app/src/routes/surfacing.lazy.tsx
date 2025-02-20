import { createLazyFileRoute } from '@tanstack/react-router';

import Surfacing from 'app/features/Surfacing';
import Page from 'app/components/Page';

export const Route = createLazyFileRoute('/surfacing')({
    component: SurfacingPage,
});

function SurfacingPage() {
    return (
        <Page title="Wasteboard Surfacing" withGoBackButton>
            <Surfacing />
        </Page>
    );
}
