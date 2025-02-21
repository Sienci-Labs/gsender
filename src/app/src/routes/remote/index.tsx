import { createFileRoute, Outlet } from '@tanstack/react-router';
import { BottomNav } from 'app/features/RemoteMode/components/BottomNav.tsx';
import DRO from 'app/features/DRO';

export const Route = createFileRoute('/remote/')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div>
            <DRO />
        </div>
    );
}
