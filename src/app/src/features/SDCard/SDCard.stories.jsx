import { expect, spyOn, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';

import SDCard from './index';

const FILES = [
  { name: 'coaster.nc', size: 48213 },
  { name: 'sign-carving.nc', size: 1572864 },
  { name: 'bad file name!.nc', size: 1024, unusable: true },
];

// Mounted card on grblHAL built with YMODEM transfers, so every action is available
const MOUNTED = {
  preset: 'idle',
  status: { sdCard: true },
  info: { NEWOPT: { YM: '' } },
  sdFiles: FILES,
};

const meta = {
  component: SDCard,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js
  parameters: { machine: MOUNTED },
  decorators: [
    (Story) => (
      <div className="h-[560px] w-[760px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// Each table row holds a file's name, size and Run/Delete buttons
const fileRow = (canvas, name) => canvas.getByText(name).closest('tr');

export const Mounted = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await expect(canvas.getByText('Mounted')).toBeVisible();
    await expect(canvas.getByText('1.5 MB')).toBeVisible();

    const row = within(fileRow(canvas, 'coaster.nc'));
    await userEvent.click(row.getByRole('button', { name: 'Run' }));
    await expect(command).toHaveBeenCalledWith('sdcard:run', 'coaster.nc');
  },
};

export const UnusableFile = {
  play: async ({ canvas }) => {
    const row = within(fileRow(canvas, 'bad file name!.nc'));
    // Firmware-flagged files can be deleted but not run
    await expect(row.getByRole('button', { name: 'Run' })).toBeDisabled();
    await expect(row.getByRole('button', { name: 'Delete' })).toBeEnabled();
  },
};

export const DeleteFile = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const command = spyOn(controller, 'command');
    await userEvent.click(within(fileRow(canvas, 'coaster.nc')).getByRole('button', { name: 'Delete' }));

    // Confirm() renders through the shared ConfirmationDialog in the preview
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('alertdialog', { name: 'Delete File' });
    await expect(dialog).toHaveTextContent('Are you sure you want to delete coaster.nc?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await expect(command).toHaveBeenCalledWith('sdcard:delete', 'coaster.nc');
    await waitFor(() => expect(canvas.queryByText('coaster.nc')).toBeNull());
  },
};

export const RefreshFiles = {
  play: async ({ canvas, userEvent }) => {
    const command = spyOn(controller, 'command');
    await userEvent.click(canvas.getByRole('button', { name: /Refresh Files/ }));
    await expect(command).toHaveBeenCalledWith('sdcard:list');
    // The list empties until the controller reports the files again
    await expect(canvas.getByText('No files found')).toBeVisible();
  },
};

export const RunningSDJob = {
  parameters: { machine: { ...MOUNTED, status: { sdCard: true, SD: { name: 'sign-carving.nc', percentage: 42 } } } },
  play: async ({ canvas }) => {
    const row = within(fileRow(canvas, 'coaster.nc'));
    await expect(row.getByRole('button', { name: 'Run' })).toBeDisabled();
    await expect(row.getByRole('button', { name: 'Delete' })).toBeDisabled();
  },
};

export const Unmounted = {
  parameters: { machine: { ...MOUNTED, status: { sdCard: false }, sdFiles: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Unmounted')).toBeVisible();
    await expect(canvas.getByRole('button', { name: /Upload/ })).toBeDisabled();
  },
};

export const NoFileTransferSupport = {
  // null, not {}: story parameters deep-merge, so {} would keep meta's NEWOPT
  parameters: { machine: { ...MOUNTED, info: null } },
  play: async ({ canvas }) => {
    // Without YMODEM or FTP the controller can't list or receive files
    await expect(canvas.getByRole('button', { name: /Refresh Files/ })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: /Upload/ })).toBeDisabled();
  },
};
