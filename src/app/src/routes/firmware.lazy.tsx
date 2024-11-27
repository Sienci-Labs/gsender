import { createLazyFileRoute } from '@tanstack/react-router';

import { UpdateAlert } from 'app/components/UpdateAlert';

export const Route = createLazyFileRoute('/firmware')({
    component: FirmwarePage,
});

import Firmware from 'app/features/Firmware';

function FirmwarePage() {
    return (
        <div className="flex justify-center items-center flex-col">
            <UpdateAlert />
            <Firmware />
        </div>
    );
}
