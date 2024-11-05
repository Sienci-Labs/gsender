import { createLazyFileRoute } from '@tanstack/react-router';
import { Config } from 'app/features/Config';
export const Route = createLazyFileRoute('/configuration')({
    component: Configuration,
});

function Configuration() {
    return (
        <div className="flex justify-center items-center flex-col h-full overflow-y-hidden">
            <Config />
        </div>
    );
}
