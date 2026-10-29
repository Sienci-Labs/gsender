import { expect, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import appStore from 'app/store';

import { AccessoryInstaller } from './index';

// Homed grblHAL on an SLB Lite running ATCi-capable firmware
const READY = {
    preset: 'idle',
    hasHomed: true,
    version: { semver: 20250701 },
    info: { BOARD: 'SLB Lite' },
    settings: { $65: '0' },
};

const meta = {
    component: AccessoryInstaller,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: { machine: READY },
    decorators: [
        (Story) => (
            <div className="h-[720px] w-[1200px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

const openWizard = async (canvas, userEvent, title) => {
    await userEvent.click(
        canvas.getByRole('button', { name: new RegExp(title) }),
    );
};

export const Hub = {
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('heading', { name: 'Accessory Installation' }),
        ).toBeVisible();
        for (const title of ['Sienci ATC', 'Sienci TLS']) {
            await expect(
                canvas.getByRole('button', { name: new RegExp(title) }),
            ).toBeVisible();
        }
    },
};

export const NotConnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas, userEvent }) => {
        await openWizard(canvas, userEvent, 'Sienci TLS');
        await expect(
            canvas.getByText(/Your controller is not connected/),
        ).toBeVisible();
        // Setup can't start until every requirement passes
        await expect(
            canvas.getByRole('button', { name: /TLS Setup Wizard/ }),
        ).toBeDisabled();
    },
};

export const NotHomed = {
    parameters: { machine: { ...READY, hasHomed: false } },
    play: async ({ canvas, userEvent }) => {
        await openWizard(canvas, userEvent, 'Sienci TLS');
        await expect(canvas.getByText(/Machine not homed/)).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: /TLS Setup Wizard/ }),
        ).toBeDisabled();
    },
};

export const TlsApplyOptions = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        // With one sub-wizard and every requirement met, it opens straight into its steps
        await openWizard(canvas, userEvent, 'Sienci TLS');
        await expect(
            await canvas.findByText('Tool Change Options'),
        ).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: /Next/ }),
        ).toBeDisabled();

        await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
        // Enables the TLS input; on SLB Lite also sets $65 bit 3 and runs its setup macro
        await expect(command).toHaveBeenCalledWith('gcode', [
            '$6=1',
            '$65=8',
            'G65 P5 Q1',
            '$$',
        ]);
        await expect(appStore.get('workspace.toolChangeOption')).toBe(
            'Fixed Tool Sensor',
        );
        await waitFor(() =>
            expect(canvas.getByRole('button', { name: /Next/ })).toBeEnabled(),
        );
    },
};

export const TlsApplyOnOlderFirmware = {
    parameters: {
        machine: {
            ...READY,
            version: { semver: 20240101 },
            info: { BOARD: 'SLB' },
        },
    },
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await openWizard(canvas, userEvent, 'Sienci TLS');
        await userEvent.click(
            await canvas.findByRole('button', { name: 'Apply' }),
        );
        // Pre-ATCi firmware also needs $668 cleared
        await expect(command).toHaveBeenCalledWith('gcode', [
            '$6=1',
            '$668=0',
            '$$',
        ]);
    },
};
