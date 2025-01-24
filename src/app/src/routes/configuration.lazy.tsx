import { createLazyFileRoute } from '@tanstack/react-router';
import { Config } from 'app/features/Config';
export const Route = createLazyFileRoute('/configuration')({
    component: Configuration,
});

function Configuration() {
    return (
        <div className="flex max-h-4/5 overflow-y-clip items-center justify-center no-scrollbar">
            <Config />
        </div>
    );
}
