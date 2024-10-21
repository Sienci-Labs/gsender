import { createRootRoute, Outlet } from '@tanstack/react-router';
import Workspace from '../workspace';

export const Route = createRootRoute({
    component: () => (
        <>
            <Workspace>
                <Outlet />
            </Workspace>
        </>
    ),
});
