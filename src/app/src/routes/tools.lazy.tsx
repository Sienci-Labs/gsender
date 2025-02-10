import { createLazyFileRoute } from '@tanstack/react-router';
import { GiFlatPlatform } from 'react-icons/gi';
import { FaKeyboard, FaMicrochip } from 'react-icons/fa';
import { LuPencilRuler } from 'react-icons/lu';
import { AiFillTool } from 'react-icons/ai';

import ToolCard from 'app/components/ToolCard';

export const Route = createLazyFileRoute('/tools')({
    component: Tools,
});

function Tools() {
    return (
        <div className="p-4">
            <p className="text-lg font-semibold mb-4">
                Choose a tool to get started...
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-2 gap-4">
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

                <ToolCard
                    title="XY Squaring"
                    description="Use this tool to ensure your machine is squared correctly"
                    icon={LuPencilRuler}
                    link="/squaring"
                />

                <ToolCard
                    title="Movement Tuning"
                    description="Use this tool adjust the movement of your machine"
                    icon={AiFillTool}
                    link="/movement-tuning"
                />

                <ToolCard
                    title="Keyboard Shortcuts"
                    description="Use this tool to adjust the keyboard shortcuts of your machine"
                    icon={FaKeyboard}
                    link="/keyboard-shortcuts"
                />
            </div>
        </div>
    );
}
