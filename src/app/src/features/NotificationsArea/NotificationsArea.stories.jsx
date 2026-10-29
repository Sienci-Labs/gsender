import { expect, waitFor, within } from 'storybook/test';

import NotificationsArea from './index';

const minutesAgo = (minutes) =>
    new Date(Date.now() - minutes * 60 * 1000).toISOString();

// Oldest first, as the preferences slice appends them
const NOTIFICATIONS = [
    {
        id: '1',
        type: 'info',
        status: 'read',
        message: 'Firmware settings restored',
        timestamp: minutesAgo(45),
    },
    {
        id: '2',
        type: 'success',
        status: 'read',
        message: 'Probe completed',
        timestamp: minutesAgo(20),
    },
    {
        id: '3',
        type: 'error',
        status: 'unread',
        message: 'Soft limit triggered on X',
        timestamp: minutesAgo(5),
    },
    {
        id: '4',
        type: 'error',
        status: 'unread',
        message: 'Probe failed to make contact',
        timestamp: minutesAgo(1),
    },
];

const meta = {
    component: NotificationsArea,
    tags: ['ai-generated'],
    // Notifications are applied to Redux by .storybook/machine-state.js
    parameters: { machine: { preset: 'idle', notifications: NOTIFICATIONS } },
    decorators: [
        (Story) => (
            <div className="h-[380px] w-[420px] p-2">
                <Story />
            </div>
        ),
    ],
};

export default meta;

// The list is a Radix popover portalled to document.body
const openNotifications = async (canvas, canvasElement, userEvent) => {
    await userEvent.click(
        canvas.getByRole('button', { name: /^Notifications/ }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(async () =>
        expect(await body.findByRole('tablist')).toBeVisible(),
    );
    return body;
};

const messages = (body) =>
    body
        .getAllByText(/./, {
            selector: '[role="tabpanel"] .flex-col > div:first-child',
        })
        .map((el) => el.textContent);

export const UnreadErrors = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        await expect(
            canvas.getByRole('button', { name: 'Notifications, 2 unread' }),
        ).toBeVisible();

        // Opening the list marks everything read, clearing the badge
        const body = await openNotifications(canvas, canvasElement, userEvent);
        await expect(
            canvas.getByRole('button', { name: 'Notifications' }),
        ).toBeVisible();

        // Newest first
        await expect(messages(body)[0]).toBe('Probe failed to make contact');
        await expect(body.getByText('5 minutes ago')).toBeVisible();
    },
};

export const FilterByType = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openNotifications(canvas, canvasElement, userEvent);
        await userEvent.click(body.getByRole('tab', { name: 'Errors' }));
        await expect(messages(body)).toEqual([
            'Probe failed to make contact',
            'Soft limit triggered on X',
        ]);

        await userEvent.click(body.getByRole('tab', { name: 'Success' }));
        await expect(messages(body)).toEqual(['Probe completed']);
    },
};

export const ClearAll = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const body = await openNotifications(canvas, canvasElement, userEvent);
        await userEvent.click(
            body.getByRole('button', { name: 'Clear all notifications' }),
        );
        await expect(body.getByText('No notifications')).toBeVisible();
        await expect(
            body.getByRole('button', { name: 'Clear all notifications' }),
        ).toBeDisabled();
    },
};

export const Empty = {
    parameters: { machine: { preset: 'idle', notifications: [] } },
    play: async ({ canvas, canvasElement, userEvent }) => {
        await expect(
            canvas.getByRole('button', { name: 'Notifications' }),
        ).toBeVisible();
        const body = await openNotifications(canvas, canvasElement, userEvent);
        await expect(body.getByText('No notifications')).toBeVisible();
    },
};
