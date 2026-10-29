import { expect, spyOn, within } from 'storybook/test';
import controller from 'app/lib/controller';

import { WorkspaceSelector } from './index';

const meta = {
    component: WorkspaceSelector,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: { machine: { preset: 'idle' } },
    decorators: [
        // Positioned absolutely (top-4 right-4) in the visualizer corner
        (Story) => (
            <div className="relative h-16 w-[300px]">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const Idle = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        const command = spyOn(controller, 'command');
        await userEvent.click(
            canvas.getByRole('combobox', { name: 'Select workspace' }),
        );
        // Select options portal to document.body
        const body = within(canvasElement.ownerDocument.body);
        await userEvent.click(
            await body.findByRole('option', { name: 'G56 (P3)' }),
        );
        await expect(command).toHaveBeenCalledWith('gcode', 'G56');
    },
};

export const ActiveG55 = {
    parameters: { machine: { preset: 'idle', modal: { wcs: 'G55' } } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('combobox', { name: 'Select workspace' }),
        ).toHaveTextContent('G55 (P2)');
    },
};

export const RunningJob = {
    parameters: { machine: { preset: 'running' } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('combobox', { name: 'Select workspace' }),
        ).toBeDisabled();
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
};
