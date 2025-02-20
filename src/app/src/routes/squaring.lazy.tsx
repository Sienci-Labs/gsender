import { createLazyFileRoute } from '@tanstack/react-router';

import Squaring from 'app/features/Squaring';
import Page from 'app/components/Page';
export const Route = createLazyFileRoute('/squaring')({
    component: SquaringPage,
});

function SquaringPage() {
    return (
        <Page title="XY Squaring" withGoBackButton>
            <Squaring />
        </Page>
    );
}
