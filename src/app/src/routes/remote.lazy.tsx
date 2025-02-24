import { createLazyFileRoute, Outlet } from '@tanstack/react-router';
import { BottomNav } from 'app/features/RemoteMode/components/BottomNav.tsx';

export const Route = createLazyFileRoute('/remote')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div>
            <div className="flex flex-col gap-8 min-h-screen">
                <Outlet />
            </div>

            <BottomNav />
        </div>
    );
}
