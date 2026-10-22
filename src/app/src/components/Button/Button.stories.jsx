import { expect, fn } from 'storybook/test';
import { MdPlayArrow } from 'react-icons/md';

import { Button } from './index';

const meta = {
  component: Button,
  tags: ['ai-generated'],
  args: { onClick: fn() },
};

export default meta;

export const Primary = {
  args: { variant: 'primary', children: 'Start' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /start/i }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Secondary = { args: { variant: 'secondary', children: 'Cancel' } };

export const Warning = { args: { variant: 'warning', children: 'Unlock' } };

export const WithIconAndText = {
  args: { variant: 'alt', icon: <MdPlayArrow />, text: 'Run Job' },
};

export const Disabled = {
  args: { variant: 'primary', children: 'Start', disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /start/i })).toBeDisabled();
  },
};
