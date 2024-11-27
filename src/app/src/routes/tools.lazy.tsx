import { GiFlatPlatform } from 'react-icons/gi';
import { createLazyFileRoute } from '@tanstack/react-router';
import { FaMicrochip } from 'react-icons/fa';

export const Route = createLazyFileRoute('/tools')({
    component: Tools,
});

import ToolCard from 'app/components/ToolCard';

function Tools() {
    return (
        <div className="p-4">
            <p className="text-lg font-semibold mb-4">
                Choose a tool to get started...
            </p>

            <div className="grid grid-cols-3 md:grid-cols-2 gap-4">
                <ToolCard
                    title="Surfacing"
                    description="Generate toolpaths to surface and level your material"
                    icon={GiFlatPlatform}
                    link="/surfacing"
                />

                <ToolCard
                    title="Firmware"
                    description="Update the firmware on your machine"
                    icon={FaMicrochip}
                    link="/firmware"
                />
            </div>
        </div>
    );
}
