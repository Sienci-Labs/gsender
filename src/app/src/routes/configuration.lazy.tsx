import { createLazyFileRoute } from '@tanstack/react-router';
import Preferences from 'app/features/Preferences';

export const Route = createLazyFileRoute('/configuration')({
    component: Configuration,
});

function Configuration() {
    return (
        <div>
            <Preferences />
        </div>
    );
}
