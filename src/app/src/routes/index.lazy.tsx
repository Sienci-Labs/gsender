import { createLazyFileRoute } from "@tanstack/react-router";

import { Column } from "../workspace/Column";
import { PrimaryArea } from "../workspace/PrimaryArea";
import { ToolArea } from "../workspace/ToolArea";

export const Route = createLazyFileRoute("/")({
    component: Index,
});

function Index() {
    return (
        <>
            <div className="flex h-[80%]">
                <div className="flex w-2/3">
                    <PrimaryArea />
                </div>

                <div className="flex w-1/3">
                    <Column />
                </div>
            </div>

            <div className="flex h-[20%] min-h-48">
                <ToolArea />
            </div>
        </>
    );
}
