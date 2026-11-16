import { expect, fn, spyOn } from 'storybook/test';

import QrScanner from './QrScanner';

// Only the no-camera fallback is covered: the viewfinder itself needs a real
// camera stream, which the test browser doesn't have.
const meta = {
    component: QrScanner,
    tags: ['ai-generated'],
    args: { onScan: fn() },
    decorators: [
        (Story) => (
            <div className="w-[360px] p-2">
                <Story />
            </div>
        ),
    ],
};

export default meta;

export const CameraUnavailable = {
    beforeEach: () => {
        spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(
            new DOMException('Permission denied', 'NotAllowedError'),
        );
    },
    play: async ({ canvas }) => {
        await expect(
            await canvas.findByText(/Could not open the camera/),
        ).toBeVisible();
    },
};
