import { expect, spyOn, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';
import appStore from 'app/store';

import { Config } from './index';

const meta = {
    component: Config,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: {
        machine: {
            preset: 'idle',
            type: 'Grbl',
            settings: { $100: '200', $101: '200', $102: '400' },
        },
    },
    decorators: [
        // The page sizes itself with the app's fixed-content-area layout class
        (Story) => (
            <div className="h-[760px] w-[1280px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

// A setting's label, description and control share one row
const settingRow = (canvas, label) =>
    within(canvas.getAllByText(label)[0].closest('div'));

// "Apply Settings" hides the word Settings below the xl breakpoint
const applyButton = (canvas) => canvas.getByRole('button', { name: /^Apply/ });

export const Overview = {
    play: async ({ canvas }) => {
        await expect(
            canvas.getByPlaceholderText('Search Config'),
        ).toBeVisible();
        await expect(
            canvas.getAllByText('Carve screen units')[0],
        ).toBeVisible();
        // Nothing to apply until something changes
        await expect(applyButton(canvas)).toBeDisabled();
    },
};

export const Search = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.type(
            canvas.getByPlaceholderText('Search Config'),
            'baud',
        );
        await waitFor(() =>
            expect(canvas.queryByText('Carve screen units')).toBeNull(),
        );
        await expect(canvas.getAllByText('Baud rate')[0]).toBeVisible();
    },
};

export const ChangeAndApplySetting = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(
            settingRow(canvas, 'Reconnect automatically').getByRole('switch'),
        );
        await waitFor(() => expect(applyButton(canvas)).toBeEnabled());

        await userEvent.click(applyButton(canvas));
        await waitFor(() =>
            expect(appStore.get('widgets.connection.autoReconnect')).toBe(true),
        );
        // Toasts fade in
        await waitFor(() =>
            expect(canvas.getByText('Updated 1 settings.')).toBeVisible(),
        );
    },
};

export const EditFirmwareSetting = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(
            canvas.getByRole('tab', { name: /EEPROM|Firmware/ }),
        );
        // EEPROM rows nest the label a level deeper than settings rows
        const label = (
            await canvas.findAllByText('X-axis travel resolution')
        )[0];
        const input = within(label.closest('[class*="border-b"]')).getByRole(
            'spinbutton',
        );
        await userEvent.clear(input);
        await userEvent.type(input, '201.5');
        await userEvent.tab();

        await userEvent.click(applyButton(canvas));
        await expect(command).toHaveBeenCalledWith('gcode', [
            '$100=201.5',
            '$$',
        ]);
    },
};

export const FirmwareSettingsNeedConnection = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('tab', { name: /EEPROM|Firmware/ }),
        );
        await expect(await canvas.findByText('Disconnected!')).toBeVisible();
    },
};
