import { expect, fn, waitFor, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import { RemoteModeDialog } from './index';

const meta = {
  component: RemoteModeDialog,
  tags: ['ai-generated'],
  args: {
    showRemote: true,
    remoteIp: '192.168.0.42',
    remotePort: 8000,
    remoteOn: false,
    onClose: fn(),
    setHeadlessSettings: fn(),
  },
  // Addresses offered in the Addr select, applied to Redux by .storybook/machine-state.js
  parameters: { machine: { preset: 'idle', ipList: ['192.168.0.42', '10.0.0.7'] } },
};

export default meta;

// The dialog, its Select and the Confirm() prompt all portal to document.body
const getBody = (canvasElement) => within(canvasElement.ownerDocument.body);

const confirmSave = async (body, userEvent) => {
  await userEvent.click(body.getByRole('button', { name: 'Save' }));
  const confirm = await body.findByRole('alertdialog', { name: 'Save Wireless CNC Settings' });
  await userEvent.click(within(confirm).getByRole('button', { name: 'Save Settings' }));
};

export const Default = {
  play: async ({ canvasElement }) => {
    const body = getBody(canvasElement);
    // The dialog fades in
    await waitFor(() => expect(body.getByRole('dialog', { name: 'Wireless CNC Control' })).toBeVisible());
    // Nothing to save until a setting changes
    await expect(body.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect(body.getByText('192.168.0.42:8000')).toBeVisible();
  },
};

export const EnableAndSave = {
  play: async ({ args, canvasElement, userEvent, msw }) => {
    let saved;
    msw.use(
      http.put('*/api/remote', async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json({});
      }),
    );
    const body = getBody(canvasElement);
    await userEvent.click(await body.findByRole('switch'));
    await confirmSave(body, userEvent);

    const payload = { ip: '192.168.0.42', port: 8000, headlessStatus: true };
    await waitFor(() => expect(saved).toEqual(payload));
    await expect(args.setHeadlessSettings).toHaveBeenCalledWith(payload);
    await expect(args.onClose).toHaveBeenCalledWith(false);
    await waitFor(() => expect(body.getByText('Updated Wireless Control Settings')).toBeVisible());
  },
};

export const ChooseAddress = {
  play: async ({ canvasElement, userEvent }) => {
    const body = getBody(canvasElement);
    await userEvent.click(await body.findByRole('combobox'));
    await userEvent.click(await body.findByRole('option', { name: '10.0.0.7' }));
    // The QR code panel shows the address phones should open
    await waitFor(() => expect(body.getByText('10.0.0.7:8000')).toBeVisible());
    // The Select hides the rest of the page from assistive tech until it finishes closing
    await expect(await body.findByRole('button', { name: 'Save' })).toBeEnabled();
  },
};

export const RejectsReservedPort = {
  play: async ({ args, canvasElement, userEvent, msw }) => {
    const update = fn();
    msw.use(http.put('*/api/remote', () => update() ?? HttpResponse.json({})));
    const body = getBody(canvasElement);
    const port = await body.findByRole('spinbutton');
    await userEvent.clear(port);
    await userEvent.type(port, '80');
    await confirmSave(body, userEvent);

    // Toasts fade in
    await waitFor(() => expect(body.getByText(/Invalid Port Number/)).toBeVisible());
    await expect(update).not.toHaveBeenCalled();
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};
