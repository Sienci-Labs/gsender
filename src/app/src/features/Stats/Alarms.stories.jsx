import { expect, waitFor, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import { StatsProvider } from './utils/StatContext';
import { Alarms } from './Alarms';
import { ALARMS, statsApi } from './statsFixtures';

const meta = {
    component: Alarms,
    tags: ['ai-generated'],
    parameters: { machine: { preset: 'idle', port: 'COM4' } },
    beforeEach: statsApi({ alarms: ALARMS }),
    decorators: [
        // StatParent wraps the stats routes in StatsProvider
        (Story) => (
            <StatsProvider>
                <div className="h-[600px] w-[1100px] p-4">
                    <Story />
                </div>
            </StatsProvider>
        ),
    ],
};

export default meta;

export const History = {
    play: async ({ canvas }) => {
        await expect(await canvas.findByText('ALARM 1 - Feeder')).toBeVisible();
        await expect(canvas.getByText('Hard limit triggered')).toBeVisible();
        await expect(canvas.getByText('ERROR 9 - Console')).toBeVisible();
        // Errors show the G-code line that caused them
        await expect(canvas.getByText('G0 X10')).toBeVisible();
    },
};

export const ClearHistory = {
    play: async ({ canvas, canvasElement, userEvent, msw }) => {
        let cleared = false;
        msw.use(
            http.delete('*/api/alarmList', () => {
                cleared = true;
                return HttpResponse.json({});
            }),
        );
        await canvas.findByText('ALARM 1 - Feeder');
        await userEvent.click(
            canvas.getByRole('button', { name: /Clear Alarms & Errors/ }),
        );

        // Confirm() renders through the shared ConfirmationDialog in the preview
        const dialog = await within(
            canvasElement.ownerDocument.body,
        ).findByRole('alertdialog', { name: 'Delete History' });
        await userEvent.click(
            within(dialog).getByRole('button', { name: 'Confirm' }),
        );

        await waitFor(() => expect(cleared).toBe(true));
        await waitFor(() =>
            expect(canvas.queryByText('ALARM 1 - Feeder')).toBeNull(),
        );
    },
};
