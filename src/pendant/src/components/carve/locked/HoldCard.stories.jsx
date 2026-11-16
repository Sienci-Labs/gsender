import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    CARVE_RIGHT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import HoldCard from './HoldCard';

const meta = {
    title: 'Pendant/Carve/HoldCard',
    component: HoldCard,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // Shown in the right column in `holdIdle` mode: a feed hold (or open door)
    // with no job running. Machine state is applied by .storybook/machine-state.js
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '380px' } },
        pendant: { width: CARVE_RIGHT, height: 360, padding: 10 },
        machine: { preset: 'idle', status: { activeState: 'Hold' } },
    },
    beforeEach: () => {
        spyOn(controller, 'command').mockImplementation(() => {});
    },
};

export default meta;

export const Hold = {
    play: async ({ canvas, userEvent }) => {
        await expect(
            canvas.getByRole('heading', { name: 'Hold' }),
        ).toBeVisible();
        await userEvent.click(
            canvas.getByRole('button', { name: 'Resume (~)' }),
        );
        await expect(controller.command).toHaveBeenCalledWith('cyclestart');
        await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
        await expect(controller.command).toHaveBeenCalledWith('reset:soft');
    },
};

export const HoldOnGrbl = {
    parameters: {
        machine: {
            preset: 'idle',
            type: 'Grbl',
            status: { activeState: 'Hold' },
        },
    },
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
        await expect(controller.command).toHaveBeenCalledWith('reset');
    },
};

export const DoorOpen = {
    // `holdIdle` also covers the safety door, which Resume can't clear
    parameters: {
        machine: { preset: 'idle', status: { activeState: 'Door' } },
    },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Resume (~)' }),
        ).toBeDisabled();
        await expect(
            canvas.getByRole('button', { name: 'Reset' }),
        ).toBeEnabled();
    },
};
