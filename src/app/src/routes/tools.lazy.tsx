import { createLazyFileRoute } from '@tanstack/react-router';
import { GiFlatPlatform } from 'react-icons/gi';
import { FaKeyboard, FaMicrochip, FaGamepad } from 'react-icons/fa';
import { LuPencilRuler } from 'react-icons/lu';
import { AiFillTool } from 'react-icons/ai';
import { TbVectorTriangle } from 'react-icons/tb';

import ToolCard from 'app/components/ToolCard';
import Page from 'app/components/Page';

export const Route = createLazyFileRoute('/tools')({
    component: Tools,
});

function Tools() {
    return (
        <Page title="Tools">
            <div className="grid grid-cols-3 sm:grid-cols-2 gap-4">
                <ToolCard
                    title="Wasteboard Surfacing"
                    description="Generate toolpaths to surface and level your material"
                    icon={GiFlatPlatform}
                    link="/surfacing"
                />

                <ToolCard
                    title="Jointer"
                    description="Create perfect perpendicular edges on your material"
                    icon={TbVectorTriangle}
                    link="/jointer"
                />

                <ToolCard
                    title="Firmware (Legacy)"
                    description="Update the firmware on your machine using the legacy firmware tool"
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
                    description="Use this tool to adjust your keyboard shortcuts"
                    icon={FaKeyboard}
                    link="/keyboard-shortcuts"
                />

                <ToolCard
                    title="Gamepad"
                    description="Use this tool to manage your gamepad profiles and settings"
                    icon={FaGamepad}
                    link="/gamepad"
                />
            </div>
        </Page>
    );
}
