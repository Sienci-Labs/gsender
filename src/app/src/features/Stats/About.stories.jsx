import { expect } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import { version } from 'app-root/package.json';

import About from './About';

const RELEASES = [
    {
        version: '1.6.4',
        date: '2026-09-30',
        notes: ['Diagnostics PDF improvements', 'Updated About page'],
    },
    {
        version: '1.6.3',
        date: '2026-08-12',
        notes: ['Fixed jog wheel focus handling'],
    },
];

const meta = {
    component: About,
    tags: ['ai-generated'],
    parameters: { docs: { story: { inline: false, height: '740px' } } },
    beforeEach: ({ msw }) => {
        msw.use(
            http.get('*/api/releasenotes', () => HttpResponse.json(RELEASES)),
        );
    },
    decorators: [
        (Story) => (
            <div className="h-[700px] w-[1100px] p-4">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const ReleaseNotes = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText(`Version ${version}`)).toBeVisible();
        await expect(
            await canvas.findByRole('heading', { name: '1.6.4 (2026-09-30)' }),
        ).toBeVisible();
        await expect(
            canvas.getByText('Fixed jog wheel focus handling'),
        ).toBeVisible();
    },
};

export const NoReleaseNotes = {
    beforeEach: ({ msw }) => {
        msw.use(http.get('*/api/releasenotes', () => HttpResponse.json([])));
    },
    play: async ({ canvas }) => {
        await expect(
            await canvas.findByText('No release notes found'),
        ).toBeVisible();
    },
};
