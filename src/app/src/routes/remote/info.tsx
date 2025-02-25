import { createFileRoute } from '@tanstack/react-router';
import MachineInfo from 'app/features/MachineInfo';
import NotificationsArea from 'app/workspace/TopBar/NotificationsArea';

export const Route = createFileRoute('/remote/info')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <MachineInfo />
            <NotificationsArea />
        </>
    );
}
