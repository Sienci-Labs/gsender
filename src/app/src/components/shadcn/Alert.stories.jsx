import { expect } from 'storybook/test';

import { Alert, AlertTitle, AlertDescription } from './Alert';

const meta = {
    component: Alert,
    tags: ['ai-generated'],
};

export default meta;

export const Default = {
    render: (args) => (
        <Alert {...args}>
            <AlertTitle>Firmware update available</AlertTitle>
            <AlertDescription>
                Restart gSender to install the latest grblHAL build.
            </AlertDescription>
        </Alert>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('alert')).toHaveTextContent(
            /firmware update available/i,
        );
    },
};

export const Destructive = {
    args: { variant: 'destructive' },
    render: (args) => (
        <Alert {...args}>
            <AlertTitle>Hard limit triggered</AlertTitle>
            <AlertDescription>
                Unlock the machine and re-home before continuing.
            </AlertDescription>
        </Alert>
    ),
};
