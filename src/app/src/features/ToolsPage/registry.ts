import type { PluginRecord } from 'app/features/Plugins/types';
import type { IconType } from 'react-icons';
import { BiSolidCylinder } from 'react-icons/bi';
import { FaGamepad, FaKeyboard, FaSdCard, FaWifi } from 'react-icons/fa';
import { GiFlatPlatform } from 'react-icons/gi';
import { LuDrill } from 'react-icons/lu';
import { MdSquareFoot } from 'react-icons/md';
import { PiPuzzlePiece } from 'react-icons/pi';
import { TbPuzzle, TbRulerMeasure } from 'react-icons/tb';

export type ToolEntry = {
    id: string;
    title: string;
    description?: string;
    blurb?: string;
    icon: IconType;
    link: string;
    plugin?: { official: boolean; record: PluginRecord };
    // Not useful on the pendant (e.g. it has no keyboard or gamepad)
    hideOnPendant?: boolean;
    // Only offered on the pendant
    pendantOnly?: boolean;
};

// IDs are persisted in workspace.pinnedTools, so keep them stable
export const BUILT_IN_TOOLS: ToolEntry[] = [
    {
        id: 'surfacing',
        title: 'Surfacing',
        description: 'Flatten your wasteboard or other non-flat stock',
        icon: GiFlatPlatform,
        link: '/tools/surfacing',
    },
    {
        id: 'rotary-surfacing',
        title: 'Rotary Surfacing',
        description: 'Turn square material into round stock for rotary cutting',
        icon: BiSolidCylinder,
        link: '/tools/rotary-surfacing',
    },
    {
        id: 'movement-tuning',
        title: 'Movement Tuning',
        description:
            'Ensure that each axis of your machine is moving accurately',
        icon: TbRulerMeasure,
        link: '/tools/movement-tuning',
    },
    {
        id: 'squaring',
        title: 'XY Squaring',
        description: 'Get your CNC accurately aligned to make square cuts',
        icon: MdSquareFoot,
        link: '/tools/squaring',
    },
    {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        description:
            'Set up keyboard shortcuts for easy navigation and control',
        icon: FaKeyboard,
        link: '/tools/keyboard-shortcuts',
        hideOnPendant: true,
    },
    {
        id: 'gamepad',
        title: 'Gamepad',
        description:
            'Easy hand-held CNC control using pre-made or custom profiles',
        icon: FaGamepad,
        link: '/tools/gamepad',
        hideOnPendant: true,
    },
    {
        id: 'sd',
        title: 'SD Card Manager',
        description: 'Manage and view files on your SD card',
        icon: FaSdCard,
        link: '/tools/sd',
    },
    {
        id: 'accessoryInstall',
        title: 'Accessory Installation',
        description: 'Install various CNC Accessories',
        icon: LuDrill,
        link: '/tools/accessoryInstall',
    },
    {
        id: 'plugins',
        title: 'Plugins',
        description: 'Manage installed UI plugins',
        icon: PiPuzzlePiece,
        link: '/tools/plugins',
    },
    {
        id: 'remote-file-receive',
        title: 'Remote File Receive',
        description:
            'Receive g-code files sent from a desktop gSender over Wi-Fi',
        icon: FaWifi,
        link: '',
        pendantOnly: true,
    },
];

export const pluginToolEntries = (plugins: PluginRecord[]): ToolEntry[] =>
    plugins.flatMap((plugin): ToolEntry[] => {
        const contribution = plugin.contributions.find(
            (c) => c.slot === 'tools-page',
        );
        if (!contribution?.route) {
            return [];
        }

        return [
            {
                id: `plugin:${plugin.id}`,
                title: contribution.label || plugin.name,
                description: `Plugin · v${plugin.version}`,
                blurb: plugin.description,
                icon: TbPuzzle,
                link: `/tools/plugin/${contribution.route}`,
                plugin: {
                    official: plugin.id.startsWith('com.sienci.'),
                    record: plugin,
                },
            },
        ];
    });
