import { createLazyFileRoute } from '@tanstack/react-router';

import { Column } from '../workspace/Column';
import { ToolArea } from '../workspace/ToolArea';
import Visualizer from '../features/Visualizer';

export const Route = createLazyFileRoute('/')({
    component: Index,
});

function Index() {
    return (
        <>
            <div className="flex h-[80%] pb-10">
                <div className="flex-grow">
                    <Visualizer />
                </div>

                <div className="flex-shrink-0 w-[33%] max-w-md overflow-hidden flex flex-col h-full">
                    <Column />
                </div>
            </div>

            <div className="flex h-[20%] min-h-48">
                <ToolArea />
            </div>
        </>
    );
}
