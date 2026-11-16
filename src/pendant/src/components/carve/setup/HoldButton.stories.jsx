import { ArrowRight, Crosshair, MoveUpRight } from 'lucide-react';
import { expect, fireEvent, fn, spyOn, waitFor, within } from 'storybook/test';
import {
    CARVE_LEFT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import HoldButton from './HoldButton';

// HoldButton has no variant prop: callers style it with className /
// fillClassName / holdingClassName. These are the looks the Position tab
// gives it, exposed as one enumerable `look` control.
const AXIS_GOTO =
    'gap-1.5 h-12 min-w-[64px] px-3.5 rounded-md border border-outline-subtle bg-surface-sunken font-mono text-[15px] font-semibold disabled:opacity-40';

const LOOKS = {
    zero: {
        className:
            'h-12 min-w-[72px] px-3.5 rounded-md border border-outline-strong font-mono text-[13px] tracking-[0.05em] text-content-secondary disabled:opacity-40',
        label: 'Hold to zero X',
        children: 'ZERO',
    },
    goToXY: {
        className:
            'flex-1 gap-2 h-14 rounded-md border border-outline-strong font-mono text-[13px] font-bold tracking-[0.04em] uppercase text-content-secondary disabled:opacity-40',
        label: 'Hold to go to XY 0',
        children: (
            <>
                <MoveUpRight className="w-[18px] h-[18px]" />
                Go To XY
            </>
        ),
    },
    zeroAll: {
        className:
            'flex-1 gap-2 h-14 rounded-md border border-transparent bg-blue-600 font-mono text-[13px] font-bold tracking-[0.04em] uppercase text-white disabled:opacity-40',
        fillClassName: 'bg-white/30',
        holdingClassName: 'ring-1 ring-white/60',
        label: 'Hold to zero all axes',
        children: (
            <>
                <Crosshair className="w-[18px] h-[18px]" />
                Zero All
            </>
        ),
    },
    ...Object.fromEntries(
        ['X', 'Y', 'Z', 'A'].map((axis) => [
            `goTo${axis}`,
            {
                className: `${AXIS_GOTO} text-axis-${axis.toLowerCase()}`,
                label: `Hold to go to ${axis} 0`,
                children: (
                    <>
                        <span>{axis}</span>
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </>
                ),
            },
        ]),
    ),
};

const meta = {
    title: 'Pendant/Carve/HoldButton',
    component: HoldButton,
    tags: ['ai-generated'],
    decorators: [withPendant],
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '120px' } },
        pendant: { width: CARVE_LEFT, padding: 24 },
    },
    args: { look: 'zero', disabled: false, onActivate: fn() },
    argTypes: {
        look: {
            description:
                'Styling the Position tab passes (className, fillClassName, holdingClassName, label and content)',
            control: { type: 'select' },
            options: Object.keys(LOOKS),
        },
        disabled: { control: { type: 'boolean' } },
        className: { table: { disable: true } },
        fillClassName: { table: { disable: true } },
        holdingClassName: { table: { disable: true } },
        'aria-label': { table: { disable: true } },
        children: { table: { disable: true } },
    },
    render: ({ look, ...args }) => {
        const { label, children, ...classes } = LOOKS[look];
        return (
            <div className="flex">
                <HoldButton {...args} {...classes} aria-label={label}>
                    {children}
                </HoldButton>
            </div>
        );
    },
};

export default meta;

// The hold runs on requestAnimationFrame timestamps. Clamping them stops the
// progress part-way so the mid-hold look stays on screen (Storybook restores
// the spy after the story).
function freezeHoldAt(ms) {
    const raf = window.requestAnimationFrame.bind(window);
    const limit = performance.now() + ms;
    spyOn(window, 'requestAnimationFrame').mockImplementation((callback) =>
        raf((now) => callback(Math.min(now, limit))),
    );
}

const fillOf = (button) => button.querySelector('span[aria-hidden]');

const idle = async ({ canvas }) => {
    const button = canvas.getByRole('button');
    await expect(button).toBeEnabled();
    await expect(fillOf(button)).toHaveStyle({ width: '0px' });
};

const midHold = async ({ args, canvas }) => {
    freezeHoldAt(350);
    const button = canvas.getByRole('button');
    await fireEvent.pointerDown(button);
    await waitFor(() =>
        expect(Number.parseFloat(fillOf(button).style.width)).toBeGreaterThan(
            40,
        ),
    );
    await expect(button).toHaveClass('ring-1');
    await expect(args.onActivate).not.toHaveBeenCalled();
};

export const Zero = { play: idle };

export const GoToXY = { args: { look: 'goToXY' }, play: idle };

export const ZeroAll = { args: { look: 'zeroAll' }, play: idle };

export const GoToX = { args: { look: 'goToX' }, play: idle };

export const GoToY = { args: { look: 'goToY' }, play: idle };

export const GoToZ = { args: { look: 'goToZ' }, play: idle };

export const GoToA = { args: { look: 'goToA' }, play: idle };

export const Disabled = {
    args: { disabled: true },
    play: async ({ args, canvas }) => {
        const button = canvas.getByRole('button', { name: 'Hold to zero X' });
        await expect(button).toBeDisabled();
        await fireEvent.pointerDown(button);
        await expect(button).not.toHaveClass('ring-1');
        await expect(args.onActivate).not.toHaveBeenCalled();
    },
};

export const DisabledZeroAll = {
    args: { look: 'zeroAll', disabled: true },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('button')).toBeDisabled();
    },
};

export const DisabledGoToX = {
    args: { look: 'goToX', disabled: true },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('button')).toBeDisabled();
    },
};

// Held half-way: the blue fill has swept half the button and the ring is on
export const MidHold = { play: midHold };

// The filled look swaps to a white fill and ring so they show on blue
export const MidHoldZeroAll = { args: { look: 'zeroAll' }, play: midHold };

export const MidHoldGoToX = { args: { look: 'goToX' }, play: midHold };

// A full 700 ms hold fires onActivate and the fill resets
export const HeldToActivate = {
    play: async ({ args, canvas }) => {
        const button = canvas.getByRole('button');
        await fireEvent.pointerDown(button);
        await waitFor(() => expect(args.onActivate).toHaveBeenCalledOnce());
        await expect(fillOf(button)).toHaveStyle({ width: '0px' });
    },
};

// A tap does nothing but pop a bubble (the aria-label) for 1.5 s
export const TappedShowsHint = {
    play: async ({ args, canvas, canvasElement }) => {
        const button = canvas.getByRole('button');
        await fireEvent.pointerDown(button);
        await fireEvent.pointerUp(button);
        const body = within(canvasElement.ownerDocument.body);
        await waitFor(() =>
            expect(body.getByRole('status')).toHaveTextContent(
                'Hold to zero X',
            ),
        );
        await expect(args.onActivate).not.toHaveBeenCalled();
    },
};
