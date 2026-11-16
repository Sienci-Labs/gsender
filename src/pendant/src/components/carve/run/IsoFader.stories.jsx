import { expect, fn, waitFor, within } from 'storybook/test';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import IsoFader from './IsoFader';

const meta = {
    title: 'Pendant/Carve/IsoFader',
    component: IsoFader,
    tags: ['ai-generated'],
    decorators: [
        // OverrideFaders lays its two faders out in a centred flex row
        (Story) => (
            <div className="flex justify-center items-center">
                <Story />
            </div>
        ),
        withPendant,
    ],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '460px' } },
        pendant: { width: Math.round(CARVE_LEFT / 2), padding: 10 },
    },
    args: {
        kind: 'feed',
        chip: 'F',
        title: 'Feed',
        value: 100,
        sub: 'F1200 mm/min',
        disabled: false,
        onPreview: fn(),
        onCommit: fn(),
    },
    argTypes: {
        kind: {
            description: 'Accent colour of the chip, fill and readout',
            control: { type: 'inline-radio' },
            options: ['feed', 'spindle', 'laser'],
        },
        chip: { description: 'Letter in the header chip' },
        value: {
            description: 'Override percentage; the cap snaps to the 10% grid',
            control: { type: 'range', min: 20, max: 200, step: 10 },
        },
        sub: { description: 'Line under the readout (live feed rate or RPM)' },
        disabled: { control: { type: 'boolean' } },
    },
};

export default meta;

const slider = (canvas, name) => canvas.getByRole('slider', { name });

export const Feed = {
    play: async ({ args, canvas, userEvent }) => {
        const fader = slider(canvas, 'Feed override');
        await expect(fader).toHaveAttribute('aria-valuenow', '100');
        await expect(canvas.getByText('100%')).toBeVisible();

        fader.focus();
        await userEvent.keyboard('{ArrowUp}');
        await expect(args.onCommit).toHaveBeenCalledWith(110);
        await userEvent.keyboard('{ArrowDown}');
        await expect(args.onCommit).toHaveBeenCalledWith(90);
    },
};

export const Spindle = {
    args: { kind: 'spindle', chip: 'S', title: 'Spindle', sub: '18000 RPM' },
    play: async ({ canvas }) => {
        await expect(slider(canvas, 'Spindle override')).toBeVisible();
        await expect(canvas.getByText('18000 RPM')).toBeVisible();
    },
};

export const Laser = {
    args: { kind: 'laser', chip: 'P', title: 'Power', sub: 'Laser power' },
    play: async ({ canvas }) => {
        await expect(slider(canvas, 'Power override')).toBeVisible();
        await expect(canvas.getByText('Laser power')).toBeVisible();
    },
};

export const Minimum = {
    args: { value: 20 },
    play: async ({ args, canvas, userEvent }) => {
        const fader = slider(canvas, 'Feed override');
        await expect(canvas.getByText('20%')).toBeVisible();
        // Already at the bottom of the range
        fader.focus();
        await userEvent.keyboard('{ArrowDown}');
        await expect(args.onCommit).toHaveBeenCalledWith(20);
    },
};

export const Maximum = {
    args: { value: 200 },
    play: async ({ canvas }) => {
        await expect(slider(canvas, 'Feed override')).toHaveAttribute(
            'aria-valuenow',
            '200',
        );
        await expect(canvas.getByText('200%')).toBeVisible();
    },
};

export const Disabled = {
    args: { disabled: true },
    play: async ({ args, canvas, userEvent }) => {
        const fader = slider(canvas, 'Feed override');
        await expect(fader).toHaveAttribute('aria-disabled', 'true');
        await expect(
            canvas.getByRole('button', {
                name: 'Hold to reset feed override',
            }),
        ).toBeDisabled();
        await userEvent.pointer({ keys: '[MouseLeft]', target: fader });
        await expect(args.onPreview).not.toHaveBeenCalled();
        await expect(args.onCommit).not.toHaveBeenCalled();
    },
};

export const TapTrackToSet = {
    play: async ({ args, canvas, userEvent }) => {
        // A tap anywhere on the track previews, then commits on release
        await userEvent.pointer({
            keys: '[MouseLeft]',
            target: slider(canvas, 'Feed override'),
        });
        await expect(args.onPreview).toHaveBeenCalledTimes(1);
        await expect(args.onCommit).toHaveBeenCalledTimes(1);
    },
};

export const TapResetShowsHint = {
    args: { value: 150 },
    play: async ({ args, canvas, canvasElement, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', {
                name: 'Hold to reset feed override',
            }),
        );
        // A tap is not a hold: nothing is committed, a hint bubble shows instead
        // The bubble portals to <body> and fades in
        await waitFor(() =>
            expect(
                within(canvasElement.ownerDocument.body).getByText(
                    'Hold to reset',
                ),
            ).toBeVisible(),
        );
        await expect(args.onCommit).not.toHaveBeenCalled();
    },
};
