import { expect, waitFor, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import { StatsProvider } from './utils/StatContext';
import { Jobs } from './Jobs';
import { JOBS, statsApi } from './statsFixtures';

const meta = {
  component: Jobs,
  tags: ['ai-generated'],
  parameters: { machine: { preset: 'idle', port: 'COM4' } },
  beforeEach: statsApi({ jobs: JOBS }),
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

export const JobHistory = {
  play: async ({ canvas }) => {
    // Every job is listed, whichever port it ran on
    for (const job of JOBS) {
      await expect(await canvas.findByText(job.file)).toBeVisible();
    }
  },
};

export const Search = {
  play: async ({ canvas, userEvent }) => {
    await canvas.findByText('coaster-set.nc');
    await userEvent.type(canvas.getByPlaceholderText('Search past jobs...'), 'sign');
    await waitFor(() => expect(canvas.queryByText('coaster-set.nc')).toBeNull());
    await expect(canvas.getByText('sign-carving.nc')).toBeVisible();
  },
};

export const ClearHistory = {
  play: async ({ canvas, canvasElement, userEvent, msw }) => {
    let cleared = false;
    msw.use(
      http.delete('*/api/jobstats', () => {
        cleared = true;
        return HttpResponse.json({});
      }),
    );
    await canvas.findByText('coaster-set.nc');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));

    // Confirm() renders through the shared ConfirmationDialog in the preview
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('alertdialog', { name: 'Delete Job History' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(cleared).toBe(true));
    await waitFor(() => expect(canvas.queryByText('coaster-set.nc')).toBeNull());
  },
};
