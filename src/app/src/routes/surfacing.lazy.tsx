import { createLazyFileRoute } from '@tanstack/react-router';
import Surfacing from 'app/features/Surfacing';

export const Route = createLazyFileRoute('/surfacing')({
    component: SurfacingPage,
});

function SurfacingPage() {
    return (
        <div className="p-4">
            <Surfacing />
        </div>
    );
}
