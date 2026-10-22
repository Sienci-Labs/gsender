import { expect, spyOn, waitFor, within } from 'storybook/test';
import appStore from 'app/store';

import GamepadWrapper from './index';

const CONTROLLER_ID = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)';

// A stand-in for what navigator.getGamepads() reports; app/lib/gamepad polls it every
// animation frame and emits gamepad:button when a button's state changes
const createGamepad = (id = CONTROLLER_ID) => ({
  id,
  index: 0,
  connected: true,
  mapping: 'standard',
  timestamp: 0,
  axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
});

const pressButton = (gamepad, index) => {
  gamepad.buttons[index] = { pressed: true, touched: true, value: 1 };
};

const storedProfiles = () => appStore.get('workspace.gamepad.profiles');

const meta = {
  component: GamepadWrapper,
  tags: ['ai-generated'],
  beforeEach: ({ parameters }) => {
    // No physical controller in the test browser: report a simulated one
    parameters.gamepad = createGamepad();
    spyOn(navigator, 'getGamepads').mockImplementation(() => [parameters.gamepad, null, null, null]);
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

const body = (canvasElement) => within(canvasElement.ownerDocument.body);

export const ProfileList = {
  play: async ({ canvas }) => {
    // gSender ships with profiles for common controllers
    await expect(canvas.getByText('Logitech F710 Gamepad')).toBeVisible();
    await expect(canvas.getByText('Xbox Controller')).toBeVisible();
  },
};

export const NoProfiles = {
  parameters: { appStore: { 'workspace.gamepad.profiles': [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No Profiles, Click the Button Below to Add One')).toBeVisible();
  },
};

export const AddProfile = {
  parameters: { appStore: { 'workspace.gamepad.profiles': [] } },
  play: async ({ canvas, canvasElement, userEvent, parameters }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Add New Gamepad Profile/ }));
    const dialog = within(await body(canvasElement).findByRole('dialog', { name: 'Add Gamepad Profile' }));
    // The dialog fades in
    await waitFor(() => expect(dialog.getByText('Connect your device and press any button on it')).toBeVisible());
    await expect(dialog.getByRole('button', { name: 'Add New Profile' })).toBeDisabled();

    // Pressing any button identifies the controller and prefills the name
    pressButton(parameters.gamepad, 0);
    await waitFor(() => expect(dialog.getByText('Profile Is Available')).toBeVisible(), { timeout: 3000 });
    await expect(dialog.getByPlaceholderText('Enter a profile name here...')).toHaveValue(CONTROLLER_ID);

    await userEvent.clear(dialog.getByPlaceholderText('Enter a profile name here...'));
    await userEvent.type(dialog.getByPlaceholderText('Enter a profile name here...'), 'Shop Xbox Pad');
    await userEvent.click(dialog.getByRole('button', { name: 'Add New Profile' }));

    await waitFor(() =>
      expect(storedProfiles()).toEqual([
        expect.objectContaining({ id: [CONTROLLER_ID], name: 'Shop Xbox Pad', mapping: 'standard' }),
      ]),
    );
    await expect(await canvas.findByText('Shop Xbox Pad')).toBeVisible();
  },
};

export const ControllerAlreadyHasProfile = {
  play: async ({ canvas, canvasElement, userEvent, parameters }) => {
    // Swap in the controller one of the bundled profiles is for
    parameters.gamepad = createGamepad(storedProfiles()[0].id[0]);
    await userEvent.click(canvas.getByRole('button', { name: /Add New Gamepad Profile/ }));
    const dialog = within(await body(canvasElement).findByRole('dialog', { name: 'Add Gamepad Profile' }));

    // Any button change identifies the controller, releases included, so the result
    // can appear as soon as polling resumes. Press one no other story uses.
    pressButton(parameters.gamepad, 3);
    // Detection runs on the next polling frame and the dialog is still animating
    await waitFor(() => expect(dialog.getByText('Profile Already Exists')).toBeVisible(), { timeout: 3000 });
    await expect(dialog.getByRole('button', { name: 'Add New Profile' })).toBeDisabled();
  },
};

export const DeleteProfile = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Delete gamepad profile Xbox Controller' }));
    const dialog = await body(canvasElement).findByRole('alertdialog', { name: 'Delete Gamepad Profile' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(canvas.queryByText('Xbox Controller')).toBeNull());
    await expect(storedProfiles().map((profile) => profile.name)).not.toContain('Xbox Controller');
  },
};
