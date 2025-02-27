import { createFileRoute, Outlet } from '@tanstack/react-router';
import { BottomNav } from 'app/features/RemoteMode/components/BottomNav.tsx';
import DRO from 'app/features/DRO';
import { Jogging } from 'app/features/Jogging';
import { WorkspaceSelector } from 'app/features/WorkspaceSelector';

export const Route = createFileRoute('/remote/')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <WorkspaceSelector />
            <DRO />
            <Jogging />
        </>
    );
}
