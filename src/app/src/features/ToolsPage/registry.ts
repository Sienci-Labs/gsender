import type { PluginRecord } from 'app/features/Plugins/types';
import { tk } from 'app/i18n';
import type { IconType } from 'react-icons';
import { BiSolidCylinder } from 'react-icons/bi';
import {
    FaGamepad,
    FaKeyboard,
    FaSdCard,
    FaTabletAlt,
    FaWifi,
} from 'react-icons/fa';
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
        title: tk('tools:registry.surfacing.title'),
        description: tk('tools:registry.surfacing.description'),
        icon: GiFlatPlatform,
        link: '/tools/surfacing',
    },
    {
        id: 'rotary-surfacing',
        title: tk('tools:registry.rotarySurfacing.title'),
        description: tk('tools:registry.rotarySurfacing.description'),
        icon: BiSolidCylinder,
        link: '/tools/rotary-surfacing',
    },
    {
        id: 'movement-tuning',
        title: tk('tools:registry.movementTuning.title'),
        description: tk('tools:registry.movementTuning.description'),
        icon: TbRulerMeasure,
        link: '/tools/movement-tuning',
    },
    {
        id: 'squaring',
        title: tk('tools:registry.squaring.title'),
        description: tk('tools:registry.squaring.description'),
        icon: MdSquareFoot,
        link: '/tools/squaring',
    },
    {
        id: 'keyboard-shortcuts',
        title: tk('tools:registry.keyboardShortcuts.title'),
        description: tk('tools:registry.keyboardShortcuts.description'),
        icon: FaKeyboard,
        link: '/tools/keyboard-shortcuts',
        hideOnPendant: true,
    },
    {
        id: 'gamepad',
        title: tk('tools:registry.gamepad.title'),
        description: tk('tools:registry.gamepad.description'),
        icon: FaGamepad,
        link: '/tools/gamepad',
        hideOnPendant: true,
    },
    {
        id: 'tablet-connect',
        title: tk('tools:registry.tabletConnect.title'),
        description: tk('tools:registry.tabletConnect.description'),
        icon: FaTabletAlt,
        link: '/tools/tablet-connect',
        hideOnPendant: true,
    },
    {
        id: 'sd',
        title: tk('tools:registry.sd.title'),
        description: tk('tools:registry.sd.description'),
        icon: FaSdCard,
        link: '/tools/sd',
    },
    {
        id: 'accessoryInstall',
        title: tk('tools:registry.accessoryInstall.title'),
        description: tk('tools:registry.accessoryInstall.description'),
        icon: LuDrill,
        link: '/tools/accessoryInstall',
    },
    {
        id: 'plugins',
        title: tk('tools:registry.plugins.title'),
        description: tk('tools:registry.plugins.description'),
        icon: PiPuzzlePiece,
        link: '/tools/plugins',
    },
    {
        id: 'remote-file-receive',
        title: tk('tools:registry.remoteFileReceive.title'),
        description: tk('tools:registry.remoteFileReceive.description'),
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
