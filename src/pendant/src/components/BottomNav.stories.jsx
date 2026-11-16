import { expect, fn } from 'storybook/test';
import { pendantParameters, withPendant } from '../../../../.storybook/pendant';

import BottomNav from './BottomNav';

const meta = {
    title: 'Pendant/BottomNav',
    component: BottomNav,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '100px' } },
    },
    args: { active: 'carve', onChange: fn() },
    argTypes: {
        active: {
            description: 'The tab currently shown',
            control: { type: 'inline-radio' },
            options: ['carve', 'tools', 'config'],
        },
    },
};

export default meta;

export const Carve = {
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: 'Tools' }));
        await expect(args.onChange).toHaveBeenCalledWith('tools');
    },
};

export const Tools = {
    args: { active: 'tools' },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Tools' }),
        ).toBeVisible();
    },
};

export const Config = {
    args: { active: 'config' },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Config' }),
        ).toBeVisible();
    },
};
