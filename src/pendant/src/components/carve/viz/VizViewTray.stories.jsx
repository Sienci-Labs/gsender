import { http, HttpResponse } from 'msw';
import { expect, fn } from 'storybook/test';
import {
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import VizViewTray from './VizViewTray';

const FILE = { name: 'sign-pocket.nc', total: 18250 };

// The visualizer handle VizStage passes down; each tray button calls into it
const visualizer = () => ({
    current: {
        armJog: fn(),
        disarmJog: fn(),
        focusToModel: fn(),
        focusToBit: fn(),
        focusToMachineBed: fn(),
        worldToScreen: () => null,
    },
});

// The floating tray at the left of the carve screen's visualizer: tap-to-move,
// centre on toolpath (or current position), centre on machine, pinned tools
const meta = {
    title: 'Pendant/Carve/VizViewTray',
    component: VizViewTray,
    tags: ['ai-generated'],
    decorators: [
        (Story) => (
            <div className="relative h-full bg-surface-sunken">
                <Story />
            </div>
        ),
        withPendant,
    ],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '360px' } },
        pendant: { width: 320, height: 320 },
        machine: { preset: 'idle' },
        appStore: { 'workspace.pinnedTools': ['surfacing', 'squaring'] },
        msw: {
            handlers: [
                http.get('*/api/plugins', () =>
                    HttpResponse.json({ plugins: [] }),
                ),
            ],
        },
    },
    args: { jogArmed: false, toolsDisabled: false, onOpenTool: fn() },
    argTypes: {
        jogArmed: {
            description:
                'Tap-to-move is armed: the next hold on the canvas moves there',
            control: { type: 'boolean' },
        },
        toolsDisabled: {
            description: 'Pinned tools only open from Setup',
            control: { type: 'boolean' },
        },
        visualizerRef: { table: { disable: true } },
    },
    render: (args) => <VizViewTray {...args} visualizerRef={visualizer()} />,
};

export default meta;

export const Idle = {
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Center on current position' }),
        ).toBeEnabled();
    },
};

export const FileLoaded = {
    parameters: { machine: { preset: 'idle', file: FILE } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Center on toolpath' }),
        ).toBeEnabled();
    },
};

export const MoveArmed = {
    args: { jogArmed: true },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Tap the canvas to jog there' }),
        ).toHaveAttribute('aria-pressed', 'true');
    },
};

export const ToolsDisabled = {
    args: { toolsDisabled: true },
    parameters: { machine: { preset: 'running', file: FILE } },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Center on current position' }),
        ).toBeDisabled();
    },
};
