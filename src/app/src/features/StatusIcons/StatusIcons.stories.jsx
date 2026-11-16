import { expect, waitFor } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import StatusIcons from './index';

const meta = {
    component: StatusIcons,
    tags: ['ai-generated'],
    parameters: { docs: { story: { inline: false, height: '100px' } } },
    decorators: [
        // Positioned absolutely (top-4 right-4) in the top bar
        (Story) => (
            <div className="relative h-16 w-[300px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const Default = {
    play: async ({ canvas }) => {
        const hrefs = canvas
            .getAllByRole('link')
            .map((link) => link.getAttribute('href'));
        await expect(hrefs).toEqual([
            '#/tools/keyboard-shortcuts',
            '#/tools/gamepad',
        ]);
        await expect(
            canvas.getByRole('button', { name: 'Notifications' }),
        ).toBeVisible();
    },
};

export const UnreadErrors = {
    parameters: {
        machine: {
            notifications: [
                {
                    id: '1',
                    type: 'error',
                    status: 'unread',
                    message: 'Soft limit triggered',
                    timestamp: Date.now(),
                },
                {
                    id: '2',
                    type: 'error',
                    status: 'unread',
                    message: 'Probe failed',
                    timestamp: Date.now(),
                },
            ],
        },
    },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Notifications, 2 unread' }),
        ).toBeVisible();
    },
};

export const RemoteModeOn = {
    beforeEach: ({ msw }) => {
        msw.use(
            http.get('*/api/remote', () =>
                HttpResponse.json({
                    ip: '192.168.0.42',
                    port: 8000,
                    headlessStatus: true,
                }),
            ),
        );
    },
    play: async ({ canvasElement }) => {
        // The remote indicator turns green once /api/remote reports headlessStatus
        await waitFor(() =>
            expect(
                canvasElement.querySelector('.fill-green-500'),
            ).not.toBeNull(),
        );
    },
};
