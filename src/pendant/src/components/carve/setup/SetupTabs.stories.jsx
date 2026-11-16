import { useEffect, useState } from 'react';
import { expect, fn } from 'storybook/test';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';
import { useFileActions } from '../../../hooks/useFileActions';

import SetupTabs, { SETUP_TABS } from './SetupTabs';

const POSITION = { x: 120.5, y: 45.25, z: -3.175 };

// CarveScreen owns the active tab and the shared file actions; this stands in
// for it so tapping a tab switches it, while the `activeTab` control still
// picks the starting tab
function SetupTabsHost({ activeTab: initialTab, onTabChange, onOpenEditor }) {
    const fileActions = useFileActions();
    const [activeTab, setActiveTab] = useState(initialTab);
    useEffect(() => setActiveTab(initialTab), [initialTab]);
    return (
        <SetupTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
                setActiveTab(tab);
                onTabChange(tab);
            }}
            fileActions={fileActions}
            onOpenEditor={onOpenEditor}
        />
    );
}

const meta = {
    title: 'Pendant/Carve/SetupTabs',
    component: SetupTabs,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // Left column of the carve screen in setup mode. Each tab's own states are
    // covered in its stories (FileTab, PositionTab, PrepTab).
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '580px' } },
        pendant: { width: CARVE_LEFT, height: 540 },
        machine: { preset: 'idle', wpos: POSITION, mpos: POSITION },
    },
    args: { activeTab: 'File', onTabChange: fn(), onOpenEditor: fn() },
    argTypes: {
        activeTab: {
            description:
                'The tab shown. Tools only exists with an ATC (workspace.atcEnabled or firmware report)',
            control: { type: 'select' },
            options: [...SETUP_TABS],
        },
        fileActions: { table: { disable: true } },
    },
    render: (args) => <SetupTabsHost {...args} />,
};

export default meta;

const tab = (canvas, name) => canvas.getByRole('tab', { name });

export const File = {
    play: async ({ args, canvas, userEvent }) => {
        await expect(tab(canvas, 'File')).toHaveAttribute(
            'aria-selected',
            'true',
        );
        await expect(canvas.getByText('No file loaded')).toBeVisible();
        // No ATC, so no Tools tab
        await expect(canvas.queryByRole('tab', { name: 'Tools' })).toBeNull();

        await userEvent.click(tab(canvas, 'Position'));
        await expect(args.onTabChange).toHaveBeenCalledWith('Position');
    },
};

export const Position = {
    args: { activeTab: 'Position' },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Hold to zero all axes' }),
        ).toBeVisible();
    },
};

export const Prep = {
    args: { activeTab: 'Prep' },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Set spindle speed' }),
        ).toBeVisible();
    },
};

export const Console = {
    args: { activeTab: 'Console' },
    play: async ({ canvas }) => {
        await expect(tab(canvas, 'Console')).toHaveAttribute(
            'aria-selected',
            'true',
        );
    },
};

export const Macros = {
    args: { activeTab: 'Macros' },
    play: async ({ canvas }) => {
        await expect(tab(canvas, 'Macros')).toHaveAttribute(
            'aria-selected',
            'true',
        );
    },
};

export const ToolsWithAtc = {
    args: { activeTab: 'Tools' },
    parameters: { appStore: { 'workspace.atcEnabled': true } },
    play: async ({ canvas }) => {
        await expect(tab(canvas, 'Tools')).toHaveAttribute(
            'aria-selected',
            'true',
        );
    },
};

export const Disconnected = {
    args: { activeTab: 'Position' },
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Hold to zero all axes' }),
        ).toBeDisabled();
    },
};
