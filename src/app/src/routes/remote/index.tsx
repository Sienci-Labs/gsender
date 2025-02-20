import { createFileRoute } from '@tanstack/react-router';
import { BottomNav } from 'app/features/RemoteMode/components/BottomNav.tsx';

export const Route = createFileRoute('/remote/')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div>
            <BottomNav />
        </div>
    );
}
