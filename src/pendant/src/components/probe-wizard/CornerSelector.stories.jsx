import { useArgs } from 'storybook/preview-api';
import { expect, fn, waitFor } from 'storybook/test';
import {
    pendantParameters,
    withPendant,
} from '../../../../../.storybook/pendant';

import CornerSelector from './CornerSelector';

// Corner picker on the probe wizard's first step. Directions follow the probe
// routine's encoding: 0 bottom left (default), 1 top left, 2 top right, 3 bottom right
const meta = {
    title: 'Pendant/ProbeWizard/CornerSelector',
    component: CornerSelector,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '260px' } },
        pendant: { width: 380, height: 220, padding: 16 },
    },
    args: { direction: 0, onChange: fn() },
    argTypes: {
        direction: {
            description: 'Selected corner',
            control: {
                type: 'select',
                labels: {
                    0: 'Bottom left',
                    1: 'Top left',
                    2: 'Top right',
                    3: 'Bottom right',
                },
            },
            options: [0, 1, 2, 3],
        },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();
        return (
            <CornerSelector
                {...args}
                onChange={(direction) => {
                    args.onChange(direction);
                    updateArgs({ direction });
                }}
            />
        );
    },
};

export default meta;

export const BottomLeft = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/Non-default corner/)).not.toBeVisible();
    },
};

export const ChooseCorner = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Top right' }),
        );
        // The new corner comes back through onChange as the direction arg
        await waitFor(() =>
            expect(canvas.getByText(/Non-default corner/)).toBeVisible(),
        );
    },
};

export const TopLeft = { args: { direction: 1 } };

export const TopRight = {
    args: { direction: 2 },
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/Non-default corner/)).toBeVisible();
    },
};

export const BottomRight = { args: { direction: 3 } };
