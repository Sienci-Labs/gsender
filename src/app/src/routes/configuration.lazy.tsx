import { createLazyFileRoute } from '@tanstack/react-router';
import { Config } from 'app/features/Config';
export const Route = createLazyFileRoute('/configuration')({
    component: Configuration,
});

function Configuration() {
    return (
        <div className="flex h-full items-center justify-center">
            <Config />
        </div>
    );
}
