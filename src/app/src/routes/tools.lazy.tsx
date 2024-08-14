import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/tools")({
    component: Tools,
});

function Tools() {
    return (
        <div className="h-full">
            <h1>Tools</h1>
        </div>
    );
}
