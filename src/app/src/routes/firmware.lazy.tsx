import { createLazyFileRoute } from '@tanstack/react-router';

import Page from 'app/components/Page';

export const Route = createLazyFileRoute('/firmware')({
    component: FirmwarePage,
});

import Firmware from 'app/features/Firmware';

function FirmwarePage() {
    return (
        <Page title="Firmware (Legacy)" withGoBackButton>
            <div className="flex justify-center items-center flex-col">
                <Firmware />
            </div>
        </Page>
    );
}
