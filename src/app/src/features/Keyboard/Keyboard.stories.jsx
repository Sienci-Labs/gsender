import { expect, waitFor, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';
import appStore from 'app/store';

import Shortcuts from './index';

// A slice of the bindings gSender stores under commandKeys
const COMMAND_KEYS = {
  ZERO_X_AXIS: { cmd: 'ZERO_X_AXIS', keys: 'shift+w', isActive: true, category: 'LOCATION_CATEGORY', title: 'Zero X-axis' },
  ZERO_ALL_AXIS: { cmd: 'ZERO_ALL_AXIS', keys: 'shift+q', isActive: true, category: 'LOCATION_CATEGORY', title: 'Zero all axes' },
  LOAD_FILE: { cmd: 'LOAD_FILE', keys: 'shift+l', isActive: true, category: 'CARVING_CATEGORY', title: 'Load file' },
  TOGGLE_SPINDLE_LASER_MODE: { cmd: 'TOGGLE_SPINDLE_LASER_MODE', keys: '', isActive: true, category: 'SPINDLE_LASER_CATEGORY', title: 'Spindle/Laser mode toggle' },
};

const meta = {
  component: Shortcuts,
  tags: ['ai-generated'],
  // Bindings live in app/store; applied by .storybook/machine-state.js
  parameters: { appStore: { commandKeys: COMMAND_KEYS } },
  // On mount, combokeys.reload() snapshots commandKeys, awaits GET /api/macros, then
  // writes the snapshot back, reverting any change saved in between. Stories wait
  // for that request (as a user effectively does) before changing bindings; if it
  // isn't made within a second, nothing can overwrite them.
  beforeEach: ({ msw, parameters }) => {
    const served = new Promise((resolve) => {
      msw.use(
        http.get('*/api/macros', () => {
          setTimeout(resolve, 50);
          return HttpResponse.json({ records: [] });
        }),
      );
    });
    parameters.macrosLoaded = Promise.race([served, new Promise((resolve) => setTimeout(resolve, 1000))]);
  },
  decorators: [
    (Story) => (
      <div className="h-[640px] w-[1100px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

const stored = () => appStore.get('commandKeys');

export const ShortcutList = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Edit shortcut for Zero X-axis' })).toBeVisible();
    // Unbound actions offer "Add" instead of "Edit"
    await expect(canvas.getByRole('button', { name: 'Add shortcut for Spindle/Laser mode toggle' })).toBeVisible();
  },
};

export const DisableAll = {
  play: async ({ parameters, canvas, userEvent }) => {
    await parameters.macrosLoaded;
    await userEvent.click(canvas.getByRole('button', { name: /Disable All/ }));
    await waitFor(() => expect(Object.values(stored()).every((shortcut) => !shortcut.isActive)).toBe(true));
    await expect(canvas.getByRole('switch', { name: 'Toggle active status for Load file' })).not.toBeChecked();
    await expect(canvas.getByRole('button', { name: /Disable All/ })).toBeDisabled();
  },
};

export const ToggleOne = {
  play: async ({ parameters, canvas, userEvent }) => {
    await parameters.macrosLoaded;
    await userEvent.click(canvas.getByRole('switch', { name: 'Toggle active status for Load file' }));
    await waitFor(() => expect(stored().LOAD_FILE.isActive).toBe(false));
    await expect(stored().ZERO_X_AXIS.isActive).toBe(true);
  },
};

// The edit dialog records the next key combination pressed anywhere on the page
const editShortcut = async (canvas, canvasElement, userEvent, title, keys) => {
  await userEvent.click(canvas.getByRole('button', { name: `Edit shortcut for ${title}` }));
  const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Edit Shortcut' });
  await userEvent.keyboard(keys);
  return within(dialog);
};

export const RebindShortcut = {
  play: async ({ parameters, canvas, canvasElement, userEvent }) => {
    await parameters.macrosLoaded;
    const dialog = await editShortcut(canvas, canvasElement, userEvent, 'Load file', '{Control>}o{/Control}');
    // The dialog fades in
    await waitFor(() => expect(dialog.getByText('Shortcut is Available')).toBeVisible());
    await userEvent.click(dialog.getByRole('button', { name: 'Update Shortcut' }));
    await waitFor(() => expect(stored().LOAD_FILE.keys).toBe('ctrl+o'));
  },
};

export const ConflictingShortcut = {
  play: async ({ parameters, canvas, canvasElement, userEvent }) => {
    await parameters.macrosLoaded;
    // shift+q already zeroes all axes
    const dialog = await editShortcut(canvas, canvasElement, userEvent, 'Load file', '{Shift>}Q{/Shift}');
    await waitFor(() =>
      expect(dialog.getByText('This shortcut is already in use by action "Zero all axes"')).toBeVisible(),
    );
    await expect(dialog.getByRole('button', { name: 'Update Shortcut' })).toBeDisabled();
  },
};
