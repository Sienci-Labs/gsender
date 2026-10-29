import { expect, fn, waitFor, within } from 'storybook/test';

import GcodeStepper from './index';

// A two-tool job: T1 from line 1, a toolchange to T2 at line 6
const LINES = [
    'T1 M6 (6mm flat end mill)',
    'S12000 M3',
    'G21 G90 G0 X0 Y0',
    'G1 X10 Y0 F800',
    'G1 X10 Y10',
    'T2 M6 (3mm ball end mill)',
    'S16000 M3',
    'G1 X20 Y20 F400',
    'M5',
    'M2',
];

const FILE = {
    name: 'two-tools.nc',
    content: LINES.join('\n'),
    total: LINES.length,
    usedAxes: ['X', 'Y'],
    fileType: 'DEFAULT',
    toolSet: ['T1', 'T2'],
    spindleToolEvents: {
        1: { T: 1, M: 6, comment: '6mm flat end mill' },
        2: { S: 12000, M: 3 },
        6: { T: 2, M: 6, comment: '3mm ball end mill' },
        7: { S: 16000, M: 3 },
    },
    estimatedTime: 0,
};

const withFile = (file) => ({ machine: { file } });

const meta = {
    component: GcodeStepper,
    tags: ['ai-generated'],
    args: { open: true, onOpenChange: fn() },
    // Machine state is applied by .storybook/machine-state.js. Parameters
    // deep-merge, so each story names its whole file rather than overriding one.
    parameters: { machine: { preset: 'idle' } },
};

export default meta;

// The stepper is a dialog, so it portals out of the canvas
const dialog = async (canvasElement) =>
    within(await within(canvasElement.ownerDocument.body).findByRole('dialog'));

const slider = (modal) => modal.getByRole('slider', { name: 'G-code line' });
const readout = (modal) => modal.getByTestId('current-line-readout');

export const OpensAtFirstLine = {
    parameters: withFile(FILE),
    play: async ({ canvasElement }) => {
        const modal = await dialog(canvasElement);
        await expect(
            modal.getByRole('heading', { name: 'G-code Step Through' }),
        ).toBeVisible();
        await expect(slider(modal)).toHaveAttribute('aria-valuenow', '1');
        await expect(slider(modal)).toHaveAttribute(
            'aria-valuemax',
            String(LINES.length),
        );
        await expect(readout(modal)).toHaveTextContent(LINES[0]);
        // Nothing comes before line 1
        await expect(
            modal.getByRole('button', { name: 'Back 100 lines' }),
        ).toBeDisabled();
    },
};

export const ScrubWithKeyboard = {
    parameters: withFile(FILE),
    play: async ({ canvasElement, userEvent }) => {
        const modal = await dialog(canvasElement);
        slider(modal).focus();

        await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        await expect(slider(modal)).toHaveAttribute('aria-valuenow', '4');
        await waitFor(() =>
            expect(readout(modal)).toHaveTextContent('G1 X10 Y0 F800'),
        );

        await userEvent.keyboard('{End}');
        await expect(slider(modal)).toHaveAttribute(
            'aria-valuenow',
            String(LINES.length),
        );
        await expect(
            modal.getByRole('button', { name: 'Forward 100 lines' }),
        ).toBeDisabled();

        await userEvent.keyboard('{Home}');
        await expect(slider(modal)).toHaveAttribute('aria-valuenow', '1');
    },
};

export const StepButtonsClampToFile = {
    parameters: withFile(FILE),
    play: async ({ canvasElement, userEvent }) => {
        const modal = await dialog(canvasElement);
        // +100 on a 10-line file lands on the last line, not past it
        await userEvent.click(
            modal.getByRole('button', { name: 'Forward 100 lines' }),
        );
        await expect(slider(modal)).toHaveAttribute(
            'aria-valuenow',
            String(LINES.length),
        );

        await userEvent.click(
            modal.getByRole('button', { name: 'Reset to start' }),
        );
        await expect(slider(modal)).toHaveAttribute('aria-valuenow', '1');
    },
};

export const JumpToTool = {
    parameters: withFile(FILE),
    play: async ({ canvasElement, userEvent }) => {
        const modal = await dialog(canvasElement);
        await userEvent.click(
            await modal.findByRole('button', { name: 'Go to tool 2, line 6' }),
        );
        await expect(slider(modal)).toHaveAttribute('aria-valuenow', '6');
        await waitFor(() => expect(readout(modal)).toHaveTextContent('T2 M6'));
    },
};

export const HideToolToolpath = {
    parameters: withFile(FILE),
    play: async ({ canvasElement, userEvent }) => {
        const modal = await dialog(canvasElement);
        const toggle = await modal.findByRole('switch', {
            name: 'Hide tool 1 toolpath',
        });
        await userEvent.click(toggle);
        await expect(
            await modal.findByRole('switch', { name: 'Show tool 1 toolpath' }),
        ).toBeVisible();
        // The other tool is unaffected
        await expect(
            modal.getByRole('switch', { name: 'Hide tool 2 toolpath' }),
        ).toBeVisible();
    },
};

export const HidePriorLines = {
    parameters: withFile(FILE),
    play: async ({ canvasElement, userEvent }) => {
        const modal = await dialog(canvasElement);
        const toggle = modal.getByRole('switch', { name: 'Hide prior lines' });
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
        await userEvent.click(toggle);
        await expect(
            modal.getByRole('switch', { name: 'Show prior lines' }),
        ).toHaveAttribute('aria-checked', 'true');
    },
};

export const PlayRunsToEnd = {
    parameters: withFile(FILE),
    play: async ({ canvasElement, userEvent }) => {
        const modal = await dialog(canvasElement);
        // No estimated time, so playback runs at 100 lines/s times the speed
        await userEvent.click(modal.getByRole('button', { name: 'Play' }));
        await waitFor(() =>
            expect(slider(modal)).toHaveAttribute(
                'aria-valuenow',
                String(LINES.length),
            ),
        );
        // Playback stops by itself at the end
        await expect(
            await modal.findByRole('button', { name: 'Play' }),
        ).toBeVisible();
    },
};

export const SingleToolFromTWord = {
    // No M6 in the file: the one T word seen still names the tool
    parameters: withFile({ ...FILE, toolSet: ['T3'], spindleToolEvents: {} }),
    play: async ({ canvasElement }) => {
        const modal = await dialog(canvasElement);
        await expect(
            await modal.findByRole(
                'button',
                { name: 'Go to tool 3, line 1' },
                { timeout: 5000 },
            ),
        ).toBeVisible();
    },
};

export const NoTools = {
    parameters: withFile({ ...FILE, toolSet: [], spindleToolEvents: {} }),
    play: async ({ canvasElement }) => {
        const modal = await dialog(canvasElement);
        await expect(
            modal.getByText('No tools found in this file.'),
        ).toBeVisible();
    },
};

export const CloseButton = {
    parameters: withFile(FILE),
    play: async ({ args, canvasElement, userEvent }) => {
        const modal = await dialog(canvasElement);
        await userEvent.click(
            modal.getByRole('button', { name: 'Close step through' }),
        );
        await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    },
};
