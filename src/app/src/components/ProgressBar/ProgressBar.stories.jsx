import { expect } from 'storybook/test';

import { ProgressBar } from './index';

const meta = {
    component: ProgressBar,
    tags: ['ai-generated'],
};

export default meta;

export const HalfwayThroughJob = {
    args: { sent: 500, total: 1000 },
    play: async ({ canvas }) => {
        const indicator = canvas
            .getByRole('progressbar')
            .querySelector('.bg-robin-500');
        await expect(indicator.style.transform).toBe('translateX(-50%)');
    },
};

export const NotStarted = { args: { sent: 0, total: 0 } };

export const Complete = { args: { sent: 1000, total: 1000 } };
