import { expect, spyOn } from 'storybook/test';
import controller from 'app/lib/controller';
import { pendantParameters, withPendant } from '../../../../.storybook/pendant';

import WorkspaceSelector from './WorkspaceSelector';

// Mirrors app/src/features/WorkspaceSelector/WorkspaceSelector.stories.jsx.
// The pendant's G54-G59 picker (visualizer corner on the carve screen, the
// legacy visualizer card's toolbar and the Move panel). The active workspace
// comes from the machine state (modal.wcs)
const meta = {
    title: 'Pendant/WorkspaceSelector',
    component: WorkspaceSelector,
    tags: ['ai-generated'],
    decorators: [
        (Story, { args }) => (
            <div
                className={`flex h-full ${args.menuAlign === 'left' ? 'justify-start' : 'justify-end'}`}
            >
                <Story />
            </div>
        ),
        withPendant,
    ],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '320px' } },
        pendant: { width: 240, height: 280, padding: 8 },
        machine: { preset: 'idle' },
    },
    args: { menuAlign: 'right' },
    argTypes: {
        menuAlign: {
            description:
                "Which edge the menu lines up with; 'left' when placed at a left edge",
            control: { type: 'inline-radio' },
            options: ['left', 'right'],
        },
    },
};

export default meta;

const trigger = (canvas) =>
    canvas.getByRole('button', { name: 'Select workspace' });

export const Idle = {
    play: async ({ canvas, userEvent }) => {
        const command = spyOn(controller, 'command').mockImplementation(
            () => {},
        );
        await userEvent.click(trigger(canvas));
        await userEvent.click(canvas.getByRole('option', { name: 'G55 (P2)' }));
        await expect(command).toHaveBeenCalledWith('gcode', 'G55');
    },
};

export const MenuOpen = {
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(trigger(canvas));
        await expect(canvas.getAllByRole('option')).toHaveLength(6);
    },
};

export const MenuAlignedLeft = {
    args: { menuAlign: 'left' },
    play: MenuOpen.play,
};

export const ActiveG55 = {
    parameters: { machine: { preset: 'idle', modal: { wcs: 'G55' } } },
    play: async ({ canvas }) => {
        await expect(trigger(canvas)).toHaveTextContent('G55 (P2)');
    },
};

export const ActiveG59 = {
    parameters: { machine: { preset: 'idle', modal: { wcs: 'G59' } } },
};

export const RunningJob = {
    parameters: { machine: { preset: 'running' } },
    play: async ({ canvas }) => {
        await expect(trigger(canvas).parentElement).toHaveClass('opacity-70');
    },
};

export const Disconnected = {
    parameters: { machine: { preset: 'disconnected' } },
};
