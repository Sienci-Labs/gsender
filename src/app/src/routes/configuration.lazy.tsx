import { createLazyFileRoute } from '@tanstack/react-router';
import Preferences from 'app/features/Preferences';
import { UpdateAlert } from 'app/components/UpdateAlert';

export const Route = createLazyFileRoute('/configuration')({
    component: Configuration,
});

function Configuration() {
    return (
        <div className="flex justify-center items-center flex-col">
            <UpdateAlert />
            <Preferences />
        </div>
    );
}
