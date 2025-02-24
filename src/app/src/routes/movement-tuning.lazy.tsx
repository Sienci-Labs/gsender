import { createLazyFileRoute } from '@tanstack/react-router';

import MovementTuning from 'app/features/MovementTuning';
import Page from 'app/components/Page';

export const Route = createLazyFileRoute('/movement-tuning')({
    component: MovementTuningPage,
});

function MovementTuningPage() {
    return (
        <Page title="Movement Tuning" withGoBackButton>
            <MovementTuning />
        </Page>
    );
}
