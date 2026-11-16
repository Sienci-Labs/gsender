import { expect, fn } from 'storybook/test';
import {
    CARVE_RIGHT,
    pendantParameters,
    withPendant,
} from '../../../../../../.storybook/pendant';

import UnlockCard from './UnlockCard';

const SHORT = (
    <>
        <h3 className="m-0 text-[13px] font-bold text-content-primary">Hold</h3>
        <p className="m-0 text-[10.5px] leading-normal text-content-disabled">
            Resume to continue from where motion stopped, or reset to drop the
            hold and return to Idle.
        </p>
    </>
);

// Taller than the card, so the content scrolls and the actions stay pinned
const LONG = (
    <>
        <h3 className="m-0 text-[13px] font-bold text-content-primary">
            Hard limit triggered
        </h3>
        {Array.from({ length: 12 }, (_, i) => (
            <p
                key={i}
                className="m-0 text-[11px] leading-[1.55] text-content-muted"
            >
                Step {i + 1}: clear the alarm, then home the machine so gSender
                can re-establish a known position.
            </p>
        ))}
    </>
);

const meta = {
    title: 'Pendant/Carve/UnlockCard',
    component: UnlockCard,
    tags: ['ai-generated'],
    decorators: [withPendant],
    // The right column of the carve screen below the visualizer, with the
    // p-2.5 CarveScreen puts around the card
    parameters: {
        ...pendantParameters,
        docs: { story: { inline: false, height: '380px' } },
        pendant: { width: CARVE_RIGHT, height: 360, padding: 10 },
    },
    // `actions` and `children` are flattened into enumerable controls
    args: {
        primaryTone: 'unlock',
        primaryLabel: 'Unlock ($X)',
        primaryDisabled: false,
        secondary: true,
        content: 'short',
        onPrimary: fn(),
        onSecondary: fn(),
    },
    argTypes: {
        primaryTone: {
            description: 'Tone of the first action',
            control: { type: 'inline-radio' },
            options: ['unlock', 'home', 'secondary'],
        },
        primaryLabel: { control: { type: 'text' } },
        primaryDisabled: {
            description: 'Disables the first action',
            control: { type: 'boolean' },
        },
        secondary: {
            description: 'Adds a secondary-tone Reset action',
            control: { type: 'boolean' },
        },
        content: {
            description: 'Card body; long content scrolls above the actions',
            control: { type: 'inline-radio' },
            options: ['short', 'long'],
        },
        actions: { table: { disable: true } },
        children: { table: { disable: true } },
    },
    render: ({
        primaryTone,
        primaryLabel,
        primaryDisabled,
        secondary,
        content,
        onPrimary,
        onSecondary,
    }) => (
        <UnlockCard
            actions={[
                {
                    label: primaryLabel,
                    tone: primaryTone,
                    onClick: onPrimary,
                    disabled: primaryDisabled,
                },
                ...(secondary
                    ? [
                          {
                              label: 'Reset',
                              tone: 'secondary',
                              onClick: onSecondary,
                          },
                      ]
                    : []),
            ]}
        >
            {content === 'long' ? LONG : SHORT}
        </UnlockCard>
    ),
};

export default meta;

export const Unlock = {
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Unlock ($X)' }),
        );
        await expect(args.onPrimary).toHaveBeenCalledOnce();
        await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));
        await expect(args.onSecondary).toHaveBeenCalledOnce();
    },
};

export const Home = {
    args: { primaryTone: 'home', primaryLabel: 'Home ($H)' },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Home ($H)' }),
        );
        await expect(args.onPrimary).toHaveBeenCalledOnce();
    },
};

export const PrimaryDisabled = {
    args: { primaryLabel: 'Resume (~)', primaryDisabled: true },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Resume (~)' }),
        ).toBeDisabled();
        await expect(
            canvas.getByRole('button', { name: 'Reset' }),
        ).toBeEnabled();
    },
};

export const SingleAction = {
    args: { secondary: false },
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('button')).toHaveLength(1);
    },
};

export const ScrollingContent = {
    args: { content: 'long' },
    play: async ({ canvas }) => {
        // The way out stays in view below the scrolling content
        await expect(
            canvas.getByRole('button', { name: 'Unlock ($X)' }),
        ).toBeVisible();
        const scroller = canvas.getByText('Hard limit triggered').parentElement;
        await expect(scroller.scrollHeight).toBeGreaterThan(
            scroller.clientHeight,
        );
    },
};
