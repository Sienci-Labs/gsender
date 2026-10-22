import { expect, fn } from 'storybook/test';

import { AccessoryConnectivityToast } from './AccessoryConnectivityToast';

const meta = {
  component: AccessoryConnectivityToast,
  tags: ['ai-generated'],
  args: { accessoryName: 'TLS', status: 'connected', onDismiss: fn() },
  decorators: [
    (Story) => (
      <div className="w-[600px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const Connected = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('article', { name: 'TLS connected' })).toBeVisible();
    await expect(canvas.getByText('Ready to use')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss tls connected notification' }));
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

export const Disconnected = {
  args: { status: 'disconnected' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Connection lost')).toBeVisible();
    // Only a connected accessory offers Manage
    await expect(canvas.queryByRole('button', { name: /Manage/ })).toBeNull();
  },
};
