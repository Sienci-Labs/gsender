import { expect } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import { StatsProvider } from './utils/StatContext';
import { Stats } from './index';

const HOUR = 60 * 60 * 1000;
const hoursAgo = (hours) => new Date(Date.now() - hours * HOUR).toISOString();

// The server returns jobs oldest first; StatsProvider reverses them
const JOBS = [
  { id: '1', file: 'coaster-set.nc', port: 'COM4', jobStatus: 'COMPLETE', duration: 0.5 * HOUR, totalLines: 8000, startTime: hoursAgo(72) },
  { id: '2', file: 'sign-carving.nc', port: 'COM4', jobStatus: 'STOPPED', duration: 0.25 * HOUR, totalLines: 40000, startTime: hoursAgo(30) },
  { id: '3', file: 'cutting-board.nc', port: 'COM4', jobStatus: 'COMPLETE', duration: 1.5 * HOUR, totalLines: 22000, startTime: hoursAgo(5) },
  { id: '4', file: 'other-machine.nc', port: 'COM7', jobStatus: 'COMPLETE', duration: 2 * HOUR, totalLines: 5000, startTime: hoursAgo(2) },
];

const ALARMS = [
  { id: 'a1', type: 'ALARM', CODE: '1', MESSAGE: 'Hard limit triggered', source: 'Feeder', time: hoursAgo(3), controller: 'grblHAL', line: '', lineNumber: 0 },
  { id: 'a2', type: 'ERROR', CODE: '9', MESSAGE: 'G-code locked out during alarm', source: 'Console', time: hoursAgo(1), controller: 'grblHAL', line: 'G0 X10', lineNumber: 1 },
];

// Hours of machine time: overdue, inside the window, and far off
const TASKS = [
  { id: 1, name: 'Lubricate rails', description: '', rangeStart: 20, rangeEnd: 30, currentTime: 42 },
  { id: 2, name: 'Check belt tension', description: '', rangeStart: 40, rangeEnd: 50, currentTime: 45 },
  { id: 3, name: 'Replace spindle brushes', description: '', rangeStart: 500, rangeEnd: 600, currentTime: 45 },
];

const statsApi = ({ jobs = [], alarms = [], tasks = [] }) => ({ msw }) => {
  msw.use(
    http.get('*/api/jobstats', () => HttpResponse.json({ jobs: structuredClone(jobs) })),
    http.get('*/api/alarmList', () => HttpResponse.json({ list: alarms })),
    http.get('*/api/maintenance', () => HttpResponse.json(tasks)),
  );
};

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
