import { expect } from 'storybook/test';

import { StatsProvider } from './utils/StatContext';
import { Stats } from './index';
import { ALARMS, JOBS, TASKS, statsApi } from './statsFixtures';

const meta = {
  component: Stats,
  tags: ['ai-generated'],
  // Connected on COM4; stats only count jobs from the connected port
  parameters: { machine: { preset: 'idle', port: 'COM4' } },
  beforeEach: statsApi({ jobs: JOBS, alarms: ALARMS, tasks: TASKS }),
  decorators: [
    // StatParent wraps the stats routes in StatsProvider
    (Story) => (
      <StatsProvider>
        <div className="w-[1200px] p-4">
          <Story />
        </div>
      </StatsProvider>
    ),
  ],
};

export default meta;

// Value cell beside a ConfigRow label
const rowValue = (canvas, label) => canvas.getByText(label).nextElementSibling;

export const Overview = {
  play: async ({ canvas }) => {
    // Recent jobs, newest first
    await expect(await canvas.findByText('other-machine.nc')).toBeVisible();
    await expect(canvas.getByText('cutting-board.nc')).toBeVisible();

    // Only the three COM4 jobs count towards this machine's stats
    await expect(rowValue(canvas, 'Total jobs run')).toHaveTextContent('3');

    await expect(canvas.getByText('Urgent!')).toBeVisible();
    await expect(canvas.getByText('Due')).toBeVisible();
    await expect(canvas.getByText('Lubricate rails')).toBeVisible();

    await expect(canvas.getByText('ALARM 1')).toBeVisible();
    await expect(canvas.getByText('ERROR 9')).toBeVisible();
  },
};

export const NoHistory = {
  beforeEach: statsApi({}),
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('No Jobs recorded. Get carving!')).toBeVisible();
    await expect(rowValue(canvas, 'Total jobs run')).toHaveTextContent('0');
  },
};

export const Disconnected = {
  parameters: { machine: { preset: 'disconnected' } },
  play: async ({ canvas }) => {
    // Job history is still listed, but per-machine stats need a connection
    await expect(await canvas.findByText('cutting-board.nc')).toBeVisible();
    await expect(rowValue(canvas, 'Total jobs run')).not.toHaveTextContent('3');
  },
};
