import { expect, spyOn, waitFor, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import controller from 'app/lib/controller';

import FileControl from './index';

const FILE = { name: 'sign-carving.nc', size: 245760, total: 4000 };

const meta = {
  component: FileControl,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js
  parameters: { machine: { preset: 'idle' } },
  decorators: [
    // The Load/Close button bar sits absolutely above the widget (top-[-35px])
    (Story) => (
      <div className="h-56 w-[460px] pt-14">
        <div className="relative h-full">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;

export const NoFile = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /Load File/ })).toBeEnabled();
    await expect(canvas.getByRole('button', { name: 'Close File' })).toBeDisabled();
  },
};

export const LastJob = {
  beforeEach: ({ msw }) => {
    msw.use(
      http.get('*/api/jobstats', () =>
        HttpResponse.json({
          jobs: [{ file: 'coaster-set.nc', jobStatus: 'COMPLETE', duration: 754000 }],
        }),
      ),
    );
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('coaster-set.nc')).toBeVisible();
    await expect(canvas.getByText('COMPLETE')).toBeVisible();
  },
};

export const FileLoaded = {
  parameters: { machine: { preset: 'idle', file: FILE } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'sign-carving' })).toBeVisible();
    await expect(canvas.getByRole('heading', { name: '.nc' })).toBeVisible();
    await expect(canvas.getByText('(4000 lines)')).toBeVisible();
    await expect(canvas.getByText('240 KB')).toBeVisible();
  },
};

export const LoadFile = {
  play: async ({ canvasElement, userEvent, msw }) => {
    let upload;
    msw.use(
      http.post('*/api/file', async ({ request }) => {
        upload = await request.formData();
        return HttpResponse.json({});
      }),
    );

    // Load File clicks a hidden <input type="file"> outside Electron
    const input = canvasElement.querySelector('input[type="file"]');
    await userEvent.upload(input, new File(['G0 X0 Y0\nG1 X10 F500\n'], 'pocket.nc'));

    await waitFor(() => expect(upload).toBeDefined());
    await expect(upload.get('gcode').name).toBe('pocket.nc');
    await expect(upload.get('visualizer')).toBe('VISUALIZER_PRIMARY');
  },
};

export const CloseFile = {
  parameters: { machine: { preset: 'idle', file: FILE } },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const command = spyOn(controller, 'command');
    await userEvent.click(canvas.getByRole('button', { name: 'Close File' }));

    // Confirmation is an AlertDialog portalled to document.body
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close File' }));

    await waitFor(() => expect(command).toHaveBeenCalledWith('gcode:unload'));
    await waitFor(() => expect(canvas.queryByText('(4000 lines)')).toBeNull());
  },
};

export const RunningJob = {
  parameters: { machine: { preset: 'running', file: FILE } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /Load File/ })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Close File' })).toBeDisabled();
  },
};
