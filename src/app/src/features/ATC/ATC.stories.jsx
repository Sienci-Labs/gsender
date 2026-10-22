import { expect, spyOn, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';

import { ATCWidget } from './index';

// Firmware tool table: T1 and T3 have probed offsets, T2 doesn't, T7 sits outside the rack
const tool = (id, z) => ({ id, toolOffsets: { x: 0, y: 0, z }, toolRadius: 3.175 });
const TOOL_TABLE = {
  1: tool(1, -42.15),
  2: tool(2, 0),
  3: tool(3, -38.6),
  7: tool(7, -51.2),
};

// Connected grblHAL with ATC compiled in, a 6-slot rack and T1 in the spindle
const ATC_READY = {
  preset: 'idle',
  info: { NEWOPT: { ATC: '1' } },
  atci: { rack_size: 6 },
  toolTable: TOOL_TABLE,
  status: { currentTool: 1 },
};

const meta = {
  component: ATCWidget,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js
  parameters: { machine: ATC_READY },
  decorators: [
    (Story) => (
      <div className="h-[360px] w-[620px] p-2">
        <Story />
      </div>
    ),
  ],
};

export default meta;

const body = (canvasElement) => within(canvasElement.ownerDocument.body);

export const NotConnected = {
  parameters: { machine: { preset: 'disconnected' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Machine Not Connected')).toBeVisible();
  },
};

export const FirmwareWithoutATC = {
  // null, not {}: story parameters deep-merge, so {} would keep meta's NEWOPT
  parameters: { machine: { ...ATC_READY, info: null } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No ATC Flag')).toBeVisible();
    await expect(canvas.getByText('Firmware did not report ATC=1 on startup.')).toBeVisible();
  },
};

export const ToolInSpindle = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await expect(canvas.getByText('T1')).toBeVisible();
    // Probing the loaded tool runs the ATCi probe macro for it
    await userEvent.click(canvas.getByRole('button', { name: /Probe/ }));
    await expect(command).toHaveBeenCalledWith('gcode', ['G65P301Q1', '$#']);
  },
};

export const EmptySpindle = {
  parameters: { machine: { ...ATC_READY, status: { currentTool: 0 } } },
  play: async ({ canvas }) => {
    // The spindle panel shows "Empty" as both its title and status
    await expect(canvas.getAllByText('Empty')[0]).toBeVisible();
    await expect(canvas.getByRole('button', { name: /Probe/ })).toBeDisabled();
  },
};

export const LoadTool = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const command = spyOn(controller, 'command');
    await userEvent.click(canvas.getByRole('button', { name: /^Load/ }));
    const popover = body(canvasElement);
    await waitFor(() => expect(popover.getByText('Load Tool')).toBeVisible());

    // Options are labelled by tool number
    await userEvent.click(popover.getByRole('combobox'));
    await userEvent.click(await popover.findByRole('option', { name: /^3/ }));
    // The widget's own Load button shares the name, so stay inside the popover
    const panel = within(popover.getByText('Load Tool').closest('[role="dialog"]'));
    await userEvent.click(await panel.findByRole('button', { name: 'Load' }));
    await expect(command).toHaveBeenCalledWith('gcode', ['M6 T3', '$#']);
  },
};

export const SelectedToolStatus = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Load/ }));
    const popover = body(canvasElement);
    await waitFor(() => expect(popover.getByText('Load Tool')).toBeVisible());

    // T2 has no offset yet, so the popover should warn about it
    await userEvent.click(popover.getByRole('combobox'));
    await userEvent.click(await popover.findByRole('option', { name: /^2/ }));
    await expect(await popover.findByText('Unprobed Tool')).toBeVisible();
  },
};

export const UnloadTool = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await userEvent.click(canvas.getByRole('button', { name: /^Unload/ }));
    await expect(command).toHaveBeenCalledWith('gcode', ['M6T0', '$#']);
  },
};

export const ToolTable = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const command = spyOn(controller, 'command');
    await userEvent.click(canvas.getByRole('button', { name: /Tools/ }));
    // Opening the table asks the controller to report its tool offsets
    await expect(command).toHaveBeenCalledWith('gcode', ['$#']);

    const table = body(canvasElement);
    await waitFor(() => expect(table.getByText('Probe All')).toBeVisible());
    await userEvent.click(table.getByText('Probe All'));
    await expect(command).toHaveBeenCalledWith('gcode', ['G65 P300', '$#']);
  },
};
