import { expect, waitFor, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import { StatsProvider } from './utils/StatContext';
import { Maintenance } from './Maintenance';

// Hours of machine time: overdue, inside the window, and far off
const TASKS = [
  { id: 1, name: 'Lubricate rails', description: 'Wipe and oil linear rails', rangeStart: 20, rangeEnd: 30, currentTime: 42 },
  { id: 2, name: 'Check belt tension', description: '', rangeStart: 40, rangeEnd: 50, currentTime: 45 },
  { id: 3, name: 'Replace spindle brushes', description: '', rangeStart: 500, rangeEnd: 600, currentTime: 45 },
];

// Serves the task list and records every PUT the page makes
const maintenanceApi = (tasks) => ({ msw, parameters }) => {
  const saves = [];
  parameters.saves = saves;
  msw.use(
    http.get('*/api/maintenance', () => HttpResponse.json(structuredClone(tasks))),
    http.put('*/api/maintenance', async ({ request }) => {
      saves.push(await request.json());
      return HttpResponse.json({});
    }),
  );
};

const meta = {
  component: Maintenance,
  tags: ['ai-generated'],
  parameters: { machine: { preset: 'idle', port: 'COM4' } },
  beforeEach: maintenanceApi(TASKS),
  decorators: [
    // StatParent wraps the stats routes in StatsProvider
    (Story) => (
      <StatsProvider>
        <div className="h-[640px] w-[1200px] p-4">
          <Story />
        </div>
      </StatsProvider>
    ),
  ],
};

export default meta;

const body = (canvasElement) => within(canvasElement.ownerDocument.body);
const lastSave = (parameters) => parameters.saves.at(-1);

export const TaskList = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('button', { name: 'Edit maintenance task for Lubricate rails' })).toBeVisible();
    await expect(canvas.getAllByText('Urgent!').length).toBeGreaterThan(0);
  },
};

export const ResetOneTimer = {
  play: async ({ canvas, canvasElement, userEvent, parameters }) => {
    // Wait for the loaded tasks; the table re-renders as they arrive
    await canvas.findAllByText('Lubricate rails');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset maintenance timer for Lubricate rails' }));
    const dialog = await body(canvasElement).findByRole(
      'alertdialog',
      { name: 'Reset Maintenance Timer' },
      { timeout: 3000 },
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Yes' }));

    await waitFor(() => expect(lastSave(parameters)).toBeDefined());
    const saved = Object.fromEntries(lastSave(parameters).map((task) => [task.name, task.currentTime]));
    await expect(saved).toEqual({ 'Lubricate rails': 0, 'Check belt tension': 45, 'Replace spindle brushes': 45 });
  },
};

export const ResetAll = {
  play: async ({ canvas, canvasElement, userEvent, parameters }) => {
    // Wait for the tasks to load: the confirm callback captures the list at click time
    await canvas.findAllByText('Lubricate rails');
    await userEvent.click(canvas.getByRole('button', { name: /Reset All/ }));
    // Confirm() renders through the shared ConfirmationDialog in the preview
    const dialog = await body(canvasElement).findByRole('alertdialog', { name: 'Reset All Tasks' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(lastSave(parameters)).toBeDefined());
    await expect(lastSave(parameters).map((task) => task.currentTime)).toEqual([0, 0, 0]);
  },
};

// Fills the add-task form; its labels aren't associated with the inputs
const addTask = async (canvas, canvasElement, userEvent) => {
  await userEvent.click(await canvas.findByRole('button', { name: /Add New Task/ }));
  const dialog = await body(canvasElement).findByRole('dialog', { name: 'Add New Task' });
  const field = (id) => dialog.querySelector(`#${id}`);
  await userEvent.type(field('grid-task-name'), 'Clean dust shoe');
  // The range fields start at 0 and 1
  await userEvent.clear(field('grid-start-range'));
  await userEvent.type(field('grid-start-range'), '10');
  await userEvent.clear(field('grid-end-range'));
  await userEvent.type(field('grid-end-range'), '15');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
};

export const AddTask = {
  play: async ({ canvas, canvasElement, userEvent, parameters }) => {
    await canvas.findAllByText('Lubricate rails');
    await addTask(canvas, canvasElement, userEvent);
    await waitFor(() => expect(lastSave(parameters)).toBeDefined());
    await expect(lastSave(parameters).at(-1)).toMatchObject({
      id: 4,
      name: 'Clean dust shoe',
      rangeStart: 10,
      rangeEnd: 15,
      currentTime: 0,
    });
  },
};

export const AddFirstTask = {
  beforeEach: maintenanceApi([]),
  play: async ({ canvas, canvasElement, userEvent, parameters }) => {
    await addTask(canvas, canvasElement, userEvent);
    await waitFor(() => expect(lastSave(parameters)).toBeDefined());
    await expect(lastSave(parameters)).toEqual([
      expect.objectContaining({ id: 1, name: 'Clean dust shoe', rangeStart: 10, rangeEnd: 15, currentTime: 0 }),
    ]);
  },
};
