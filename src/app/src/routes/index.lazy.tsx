import { createLazyFileRoute } from '@tanstack/react-router';

import { Column } from '../workspace/Column';
import { ToolArea } from '../workspace/ToolArea';
import { Visualizer } from '../features/Visualizer';

export const Route = createLazyFileRoute('/')({
    component: Index,
});

function Index() {
    return (
        <>
            <div className="flex h-[80%] pb-10">
                <div className="flex w-full">
                    <Visualizer />
                </div>

                <div className="flex min-w-96 max-w-xs">
                    <Column />
                </div>
            </div>

            <div className="flex h-[20%] min-h-48">
                <ToolArea />
            </div>
        </>
    );
}
