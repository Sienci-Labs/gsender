import { createFileRoute } from '@tanstack/react-router';

import { MachineInfoDisplay } from 'app/features/MachineInfo/MachineInfoDisplay.tsx';
import { NotificationDisplay } from 'app/workspace/TopBar/NotificationsArea/NotificationDisplay.tsx';

export const Route = createFileRoute('/remote/info')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex flex-col justify-center gap-8 p-4">
            <div>
                <MachineInfoDisplay open={true} pinned={true} />
            </div>

            <div>
                <NotificationDisplay />
            </div>
        </div>
    );
}
