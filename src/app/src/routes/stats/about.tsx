import { createFileRoute } from '@tanstack/react-router';

import About from 'app/features/Stats/About';

export const Route = createFileRoute('/stats/about')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <About />
        </>
    );
}
