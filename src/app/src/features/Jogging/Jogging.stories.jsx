import { expect, spyOn, waitFor } from 'storybook/test';
import controller from 'app/lib/controller';
import appStore from 'app/store';
import reduxStore from 'app/store/redux';
import {
  updateControllerState,
  updateWorkflowState,
} from 'app/store/redux/slices/controller.slice';

import { Jogging } from './index';

// Simulate a job starting while the widget is mounted, as the socket would report it
const startJob = () => {
  const { type, state } = reduxStore.getState().controller;
  reduxStore.dispatch(
    updateControllerState({ type, state: { ...state, status: { ...state.status, activeState: 'Run' } } }),
  );
  reduxStore.dispatch(updateWorkflowState({ state: 'running' }));
};

const meta = {
  component: Jogging,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js
  parameters: { machine: { preset: 'idle' } },
  decorators: [
    (Story) => (
      <div className="w-[460px] p-2">
        <Story />
      </div>
    ),
  ],
};

export default meta;

const jogButton = (canvas, name) => canvas.getByRole('button', { name });

export const Idle = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    // Normal preset: 5 mm XY steps at 3000 mm/min
    await userEvent.click(jogButton(canvas, 'Jog X plus'));
    await expect(command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X5 F3000']);
  },
};

export const RapidPreset = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await userEvent.click(canvas.getByRole('button', { name: 'Set to Rapid jog preset' }));
    await expect(canvas.getByRole('button', { name: 'Set to Rapid jog preset' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(jogButton(canvas, 'Jog Y minus'));
    await expect(command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 Y-20 F5000']);
  },
};

export const KeyboardJog = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    jogButton(canvas, 'Jog X minus Y plus').focus();
    await userEvent.keyboard('{Enter}');
    await expect(command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X-5 Y5 F3000']);
  },
};

export const ContinuousJog = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    const xPlus = jogButton(canvas, 'Jog X plus');
    // Holding past the long-press threshold (200 ms) jogs until release
    await userEvent.pointer({ keys: '[MouseLeft>]', target: xPlus });
    await waitFor(() => expect(command).toHaveBeenCalledWith('jog:start', { X: 1 }, 3000, expect.anything()), {
      timeout: 1000,
    });
    await userEvent.pointer({ keys: '[/MouseLeft]', target: xPlus });
    await waitFor(() => expect(command).toHaveBeenCalledWith('jog:stop'));
  },
};

export const RunningJob = {
  parameters: { machine: { preset: 'running' } },
  play: async ({ canvas }) => {
    // Jog segments block the mouse with pointer-events:none and drop out of the tab order
    const xPlus = jogButton(canvas, 'Jog X plus');
    await expect(getComputedStyle(xPlus).pointerEvents).toBe('none');
    await expect(xPlus).toHaveAttribute('tabindex', '-1');
  },
};

export const KeyboardBlockedWhenJobStarts = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    const xPlus = jogButton(canvas, 'Jog X plus');
    const zPlus = jogButton(canvas, 'Jog Z plus');

    // A segment focused before the job keeps focus after it starts
    xPlus.focus();
    startJob();
    await waitFor(() => expect(xPlus).toHaveAttribute('tabindex', '-1'));
    await expect(xPlus).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    zPlus.focus();
    await userEvent.keyboard('{Enter}');
    await expect(command).not.toHaveBeenCalled();
  },
};

export const KeyboardBlockedOnRotaryDisabledSegments = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    const yPlus = jogButton(canvas, 'Jog Y plus');
    const xPlusYPlus = jogButton(canvas, 'Jog X plus Y plus');

    // Switching to rotary mode disables every segment that moves Y
    yPlus.focus();
    appStore.set('workspace.mode', 'ROTARY');
    await waitFor(() => expect(yPlus).toHaveAttribute('tabindex', '-1'));
    await expect(yPlus).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    xPlusYPlus.focus();
    await userEvent.keyboard(' ');
    await expect(command).not.toHaveBeenCalled();

    // X-only segments stay enabled in rotary mode
    jogButton(canvas, 'Jog X plus').focus();
    await userEvent.keyboard('{Enter}');
    await expect(command).toHaveBeenCalledWith('gcode', ['$J=G21 G91 X5 F3000']);
  },
};

export const RotaryAxis = {
  parameters: { appStore: { 'widgets.rotary.tab.show': true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('spinbutton', { name: 'A jog distance' })).toBeVisible();
  },
};

export const Disconnected = {
  parameters: { machine: { preset: 'disconnected' } },
  play: async ({ canvas }) => {
    // Stop is an <svg role="button">; it leaves the tab order but has no aria-disabled
    await expect(canvas.getByRole('button', { name: 'Stop Jogging' })).toHaveAttribute('tabindex', '-1');
  },
};
