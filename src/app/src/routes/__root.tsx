import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import Workspace from "../workspace";

export const Route = createRootRoute({
    component: () => (
        <>
            <Workspace>
                <Outlet />
            </Workspace>
            <TanStackRouterDevtools />
        </>
    ),
});
