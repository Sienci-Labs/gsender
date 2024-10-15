import { createLazyFileRoute } from '@tanstack/react-router';

import { UpdateAlert } from 'app/components/UpdateAlert';

export const Route = createLazyFileRoute('/tools')({
    component: Tools,
});

import Firmware from 'app/features/Firmware';

function Tools() {
    return (
        <div className="flex justify-center items-center flex-col">
            <UpdateAlert />
            <Firmware />
        </div>
    );
}
