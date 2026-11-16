import { expect, fn } from 'storybook/test';

import { AccessoryConnectivityToast } from './AccessoryConnectivityToast';

const meta = {
    component: AccessoryConnectivityToast,
    tags: ['ai-generated'],
    parameters: { docs: { story: { inline: false, height: '230px' } } },
    args: {
        accessoryName: 'TLS',
        status: 'connected',
        onDismiss: fn(),
        onManage: fn(),
    },
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
        await expect(
            canvas.getByRole('article', { name: 'TLS connected' }),
        ).toBeVisible();
        await expect(canvas.getByText('Ready to use')).toBeVisible();
        await userEvent.click(
            canvas.getByRole('button', {
                name: 'Dismiss tls connected notification',
            }),
        );
        await expect(args.onDismiss).toHaveBeenCalledOnce();
        await userEvent.click(canvas.getByRole('button', { name: /Manage/ }));
        await expect(args.onManage).toHaveBeenCalledOnce();
    },
};

export const Disconnected = {
    args: { status: 'disconnected' },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Connection lost')).toBeVisible();
        // Only a connected accessory offers Manage
        await expect(
            canvas.queryByRole('button', { name: /Manage/ }),
        ).toBeNull();
    },
};

export const ConnectedWithoutManage = {
    // Without somewhere to go, a connected toast offers no Manage button
    args: { onManage: undefined },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Ready to use')).toBeVisible();
        await expect(
            canvas.queryByRole('button', { name: /Manage/ }),
        ).toBeNull();
    },
};
