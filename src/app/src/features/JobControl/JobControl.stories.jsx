import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';

import JobControl from './index';

const FILE = { name: 'sign-carving.nc', total: 4000 };

// Sender progress 30% of the way through FILE
const SENDER = {
  sent: 1200,
  received: 1190,
  total: 4000,
  currentLineRunning: 1200,
  startTime: Date.now() - 6 * 60 * 1000,
  elapsedTime: 6 * 60 * 1000,
  remainingTime: 14 * 60,
};

const meta = {
  component: JobControl,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js
  parameters: { machine: { preset: 'idle', file: FILE } },
  decorators: [
    // Buttons and progress are absolutely positioned above the widget (top-[-80px])
    (Story) => (
      <div className="relative h-[420px] w-[460px] pt-64">
        <div className="relative h-40">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;

const button = (canvas, name) => canvas.getByRole('button', { name });

export const ReadyToStart = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await expect(button(canvas, 'Pause')).toBeDisabled();
    await expect(button(canvas, 'Stop')).toBeDisabled();
    await userEvent.click(button(canvas, 'Start'));
    await expect(command).toHaveBeenCalledWith('gcode:start');
  },
};

export const NoFileLoaded = {
  // Story parameters deep-merge into meta's, so clear the file explicitly
  parameters: { machine: { preset: 'idle', file: null } },
  play: async ({ canvas }) => {
    await expect(button(canvas, 'Start')).toBeDisabled();
  },
};

export const Running = {
  parameters: {
    machine: { preset: 'running', file: FILE, sender: SENDER, status: { ov: [120, 100, 90] } },
  },
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await expect(canvas.getByRole('progressbar', { name: 'Job Progress' })).toHaveAttribute('aria-valuenow', '30');
    await expect(canvas.getByText('1200 / 4000 Lines')).toBeVisible();
    await expect(button(canvas, 'Start')).toBeDisabled();
    await userEvent.click(button(canvas, 'Pause'));
    await expect(command).toHaveBeenCalledWith('gcode:pause');
  },
};

export const Paused = {
  parameters: { machine: { preset: 'hold', file: FILE, sender: SENDER } },
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await userEvent.click(button(canvas, 'Start'));
    await expect(command).toHaveBeenCalledWith('gcode:resume');
    await userEvent.click(button(canvas, 'Stop'));
    await expect(command).toHaveBeenCalledWith('gcode:stop', { force: true });
  },
};

export const Disconnected = {
  parameters: { machine: { preset: 'disconnected', file: FILE } },
  play: async ({ canvas }) => {
    await expect(button(canvas, 'Start')).toBeDisabled();
  },
};
