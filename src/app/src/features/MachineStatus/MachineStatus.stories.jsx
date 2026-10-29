import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';

import MachineStatus from './MachineStatus';

const meta = {
    component: MachineStatus,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: { machine: { preset: 'idle' } },
    decorators: [
        // Centred absolutely over the visualizer in the app
        (Story) => (
            <div className="relative h-56 w-[600px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const Idle = {
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('status')).toHaveTextContent('Idle');
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('status')).toHaveTextContent(
            'Disconnected',
        );
    },
};

export const Running = { parameters: { machine: { preset: 'running' } } };

export const Hold = { parameters: { machine: { preset: 'hold' } } };

export const Door = {
    parameters: {
        machine: { preset: 'hold', status: { activeState: 'Door' } },
    },
};

export const ToolChange = {
    parameters: {
        machine: { preset: 'idle', status: { activeState: 'Tool' } },
    },
};

export const HardLimitAlarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 1 } } },
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await expect(canvas.getByRole('status')).toHaveTextContent('Alarm(1)');
        await userEvent.click(
            canvas.getByRole('button', { name: /Click to Unlock Machine/ }),
        );
        await expect(command).toHaveBeenCalledWith('reset:limit');
    },
};

export const HomingRequiredAlarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 11 } } },
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(
            canvas.getByRole('button', { name: /Click to Run Homing/ }),
        );
        await expect(command).toHaveBeenCalledWith('homing');
    },
};
