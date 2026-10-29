import { expect } from 'storybook/test';

import Tools from './index';

const meta = {
    component: Tools,
    tags: ['ai-generated'],
    // Machine and workspace state are applied by .storybook/machine-state.js
    parameters: { machine: { preset: 'idle' } },
    decorators: [
        // The tab strip sits absolutely above the widget body (Tabs uses top-[-41px])
        (Story) => (
            <div className="h-[420px] w-[520px] pt-14">
                <Story />
            </div>
        ),
    ],
};

export default meta;

const tabNames = (canvas) =>
    canvas.getAllByRole('tab').map((tab) => tab.textContent);

export const Default = {
    play: async ({ canvas }) => {
        // Spindle/Laser, ATC and Rotary are opt-in
        await expect(tabNames(canvas)).toEqual([
            'Probe',
            'Macros',
            'Coolant',
            'Console',
        ]);
        await expect(
            canvas.getByRole('tab', { name: 'Probe' }),
        ).toHaveAttribute('aria-selected', 'true');
    },
};

export const AllToolsEnabled = {
    parameters: {
        workspace: { spindleFunctions: true, atcEnabled: true },
        appStore: { 'widgets.rotary.tab.show': true },
    },
    play: async ({ canvas }) => {
        await expect(tabNames(canvas)).toEqual([
            'Probe',
            'Macros',
            'Spindle/Laser',
            'ATC',
            'Coolant',
            'Rotary',
            'Console',
        ]);
    },
};

export const AtcCompiledIntoFirmware = {
    // The ATC tab also appears when grblHAL reports ATC support, even if not enabled in settings
    parameters: { machine: { preset: 'idle', info: { NEWOPT: { ATC: '1' } } } },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('tab', { name: 'ATC' })).toBeVisible();
    },
};

export const SwitchTabs = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('tab', { name: 'Coolant' }));
        await expect(
            canvas.getByRole('tab', { name: 'Coolant' }),
        ).toHaveAttribute('aria-selected', 'true');
        await expect(
            canvas.getByRole('button', { name: 'Mist' }),
        ).toBeVisible();
    },
};
