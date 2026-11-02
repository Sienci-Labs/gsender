import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';

import { UnlockButton } from './index';

const meta = {
    component: UnlockButton,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: {
        docs: { story: { inline: false, height: '120px' } },
        machine: { preset: 'idle' },
    },
    decorators: [
        // Positioned absolutely (left-72) against the top bar
        (Story) => (
            <div className="relative h-20 w-[400px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const Unlocked = {
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Machine is unlocked.' }),
        ).toBeVisible();
    },
};

export const Alarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 1 } } },
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(
            canvas.getByRole('button', { name: /locked in alarm/ }),
        );
        await expect(command).toHaveBeenCalledWith('unlock');
    },
};

export const SoftLimitAlarm = {
    parameters: { machine: { preset: 'alarm', status: { alarmCode: 10 } } },
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(
            canvas.getByRole('button', { name: /locked in alarm/ }),
        );
        await expect(command).toHaveBeenCalledWith('reset:limit');
    },
};

export const Hold = {
    parameters: { machine: { preset: 'hold' } },
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(
            canvas.getByRole('button', { name: /Machine is held/ }),
        );
        await expect(command).toHaveBeenCalledWith('cyclestart');
    },
};
