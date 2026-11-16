import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import RapidPresets from './RapidPresets';

const meta = {
    title: 'Pendant/Carve/RapidPresets',
    component: RapidPresets,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // The highlighted step is the status report's rapid override, `ov[1]`
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '120px' } },
        pendant: { width: CARVE_LEFT, padding: 10 },
        machine: { preset: 'running', status: { ov: [100, 100, 100] } },
    },
    beforeEach: () => {
        spyOn(controller, 'command').mockImplementation(() => {});
    },
};

export default meta;

const preset = (canvas, value) =>
    canvas.getByRole('button', { name: `${value}%` });

const ACTIVE = 'bg-blue-600';

export const Rapid100 = {
    play: async ({ canvas, userEvent }) => {
        await expect(preset(canvas, 100)).toHaveClass(ACTIVE);
        await expect(preset(canvas, 50)).not.toHaveClass(ACTIVE);

        await userEvent.click(preset(canvas, 50));
        await expect(controller.command).toHaveBeenCalledWith(
            'rapidOverride',
            50,
        );
    },
};

export const Rapid50 = {
    parameters: {
        machine: { preset: 'running', status: { ov: [100, 50, 100] } },
    },
    play: async ({ canvas, userEvent }) => {
        await expect(preset(canvas, 50)).toHaveClass(ACTIVE);

        await userEvent.click(preset(canvas, 100));
        await expect(controller.command).toHaveBeenCalledWith(
            'rapidOverride',
            100,
        );
    },
};

export const Rapid25 = {
    parameters: {
        machine: { preset: 'running', status: { ov: [100, 25, 100] } },
    },
    play: async ({ canvas, userEvent }) => {
        await expect(preset(canvas, 25)).toHaveClass(ACTIVE);
        await expect(preset(canvas, 100)).not.toHaveClass(ACTIVE);

        await userEvent.click(preset(canvas, 25));
        await expect(controller.command).toHaveBeenCalledWith(
            'rapidOverride',
            25,
        );
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
    play: async ({ canvas }) => {
        for (const value of [25, 50, 100]) {
            await expect(preset(canvas, value)).toBeDisabled();
        }
    },
};
