import { expect } from 'storybook/test';

import IncomingFileProgressBar from './IncomingFileProgressBar';

const meta = {
    component: IncomingFileProgressBar,
    tags: ['ai-generated'],
    // The component takes one `transfer` object (from useIncomingFileTransfer);
    // its fields are flattened into separate controls here
    args: { state: 'receiving', name: 'sign.nc', percent: 42, message: '' },
    argTypes: {
        state: {
            description: 'Transfer phase; idle renders nothing',
            control: { type: 'inline-radio' },
            options: ['idle', 'receiving', 'complete', 'error'],
        },
        name: { control: { type: 'text' } },
        percent: { control: { type: 'range', min: 0, max: 100, step: 1 } },
        message: {
            description: 'Error text shown when state is error',
            control: { type: 'text' },
        },
        transfer: { table: { disable: true } },
    },
    render: ({ state, name, percent, message }) => (
        <IncomingFileProgressBar transfer={{ state, name, percent, message }} />
    ),
    decorators: [
        (Story) => (
            <div className="w-[480px] p-2">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const Receiving = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Receiving sign.nc…')).toBeVisible();
        await expect(canvas.getByText('42%')).toBeVisible();
    },
};

export const JustStarted = {
    args: { percent: 0 },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('0%')).toBeVisible();
    },
};

export const Complete = {
    args: { state: 'complete', percent: 100 },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Received')).toBeVisible();
        await expect(canvas.getByText('100%')).toBeVisible();
    },
};

export const Failed = {
    args: { state: 'error', message: 'Connection lost' },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('sign.nc failed')).toBeVisible();
        await expect(canvas.getByText('Connection lost')).toBeVisible();
    },
};

export const FailedWithoutDetails = {
    args: { state: 'error', name: '', message: '' },
    play: async ({ canvas }) => {
        // Used as both the heading and the bar's message
        await expect(canvas.getAllByText('Transfer failed')).toHaveLength(2);
    },
};

export const Idle = {
    args: { state: 'idle' },
    play: async ({ canvas }) => {
        await expect(canvas.queryByText(/sign\.nc/)).toBeNull();
    },
};
