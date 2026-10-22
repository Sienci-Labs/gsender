import { expect } from 'storybook/test';

import { Spinner } from './Spinner';

const meta = {
  component: Spinner,
  tags: ['ai-generated'],
};

export default meta;

export const Default = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  },
};

export const Large = { args: { className: 'size-10 text-blue-500' } };
