import { expect, spyOn, waitFor } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import pubsub from 'pubsub-js';

import SurfacingTool from './index';

// Captures the generated program the tool uploads for its preview visualizer
const captureUpload = (msw) => {
    const upload = {};
    msw.use(
        http.post('*/api/file', async ({ request }) => {
            const form = await request.formData();
            upload.name = form.get('gcode').name;
            upload.gcode = await form.get('gcode').text();
            upload.visualizer = form.get('visualizer');
            return HttpResponse.json({});
        }),
    );
    return upload;
};

const meta = {
    component: SurfacingTool,
    tags: ['ai-generated'],
    // Machine state is applied by .storybook/machine-state.js
    parameters: {
        docs: { story: { inline: false, height: '920px' } },
        machine: { preset: 'idle' },
    },
    decorators: [
        (Story) => (
            <div className="w-[1100px] p-4">
                <Story />
            </div>
        ),
    ],
};

export default meta;

// Labels aren't associated with the inputs (InputArea's htmlFor is the label text)
const input = (canvasElement, id) => canvasElement.querySelector(`#${id}`);

export const Default = {
    play: async ({ canvas }) => {
        await expect(canvas.getByText(/No g-code generated yet/)).toBeVisible();
        await expect(
            canvas.getByRole('button', { name: 'Load to Main Visualizer' }),
        ).toBeDisabled();
        await expect(
            canvas.getByRole('tab', { name: /G-Code/ }),
        ).toBeDisabled();
    },
};

export const GenerateAndLoad = {
    play: async ({ canvas, canvasElement, userEvent, msw }) => {
        const upload = captureUpload(msw);
        const publish = spyOn(pubsub, 'publish');

        // 200 x 150 mm instead of the 100 x 100 default
        await userEvent.clear(input(canvasElement, 'width'));
        await userEvent.type(input(canvasElement, 'width'), '200');
        await userEvent.clear(input(canvasElement, 'length'));
        await userEvent.type(input(canvasElement, 'length'), '150');
        await userEvent.click(
            canvas.getByRole('button', { name: 'Generate G-code' }),
        );

        await waitFor(() => expect(upload.gcode).toBeDefined());
        await expect(upload.name).toBe('gSender_Surfacing');
        await expect(upload.visualizer).toBe('VISUALIZER_SECONDARY');
        await expect(upload.gcode).toContain('M3 S17000');

        // The G-code tab unlocks and shows the generated program
        await userEvent.click(
            canvas.getByRole('tab', { name: /G-Code \(\d+ lines\)/ }),
        );
        await expect(canvasElement.querySelector('pre')).toHaveTextContent(
            'M3 S17000',
        );

        await userEvent.click(
            canvas.getByRole('button', { name: 'Load to Main Visualizer' }),
        );
        await expect(publish).toHaveBeenCalledWith(
            'gcode:surfacing',
            expect.objectContaining({
                gcode: upload.gcode,
                name: 'gSender_Surfacing.gcode',
            }),
        );
        await waitFor(() => expect(window.location.hash).toBe('#/'));
    },
};

export const CutDepthExceedsMax = {
    play: async ({ canvas, canvasElement, userEvent }) => {
        await userEvent.clear(input(canvasElement, 'skimDepth'));
        await userEvent.type(input(canvasElement, 'skimDepth'), '3');
        await expect(
            canvas.getByText(
                /Warning: Cut depth \(3 mm\) exceeds max depth \(1 mm\)/,
            ),
        ).toBeVisible();
    },
};

export const Inches = {
    parameters: { workspace: { units: 'in' } },
    play: async ({ canvasElement }) => {
        // Stored values are metric; 100 mm shows as just under 4 in
        const width = Number(input(canvasElement, 'width').value);
        await expect(width).toBeGreaterThan(3.9);
        await expect(width).toBeLessThan(4);
    },
};

export const RunningJob = {
    parameters: { machine: { preset: 'running' } },
    play: async ({ canvas }) => {
        await expect(
            canvas.getByRole('button', { name: 'Generate G-code' }),
        ).toBeDisabled();
    },
};
