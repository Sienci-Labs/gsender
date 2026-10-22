import { expect, fn, waitFor, within } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import InstallPluginDialog from './InstallPluginDialog';

const SOURCE = '/Users/maker/Downloads/demo-plugin.zip';

const PLAN = {
  kind: 'new',
  plugin: {
    id: 'com.sienci.demo',
    name: 'Demo Plugin',
    description: 'Does demo things',
    version: '1.2.0',
    engine: '>=1.6.0',
    contributions: [{ slot: 'tools-page', route: 'demo', label: 'Demo' }],
  },
  installedVersion: null,
  incomingVersion: '1.2.0',
  permissions: ['machine:read'],
  verifiedPermissions: ['machine:read'],
  declaredOnlyPermissions: [],
  capabilities: { requestTypes: [], topics: [], allowedFunctions: [] },
  scanned: true,
  unverifiable: false,
  engine: { checked: true, satisfied: true, appVersion: '1.6.2', range: '>=1.6.0' },
  shadowedBy: null,
  sourcePath: SOURCE,
  targetDir: '/Users/maker/gSender/plugins/com.sienci.demo',
};

const PREPARE_LOG = [
  { level: 'info', message: 'Extracting demo-plugin.zip', at: 't1' },
  { level: 'warn', message: 'Skipped 1 symlink entries', at: 't2' },
];

// Picking a source is only offered in the desktop app, where the main process
// answers a picker request over IPC. Stand in for both while a story runs.
const pretendDesktopApp = () => {
  const hadProcess = 'process' in window;
  const previousType = window.process?.type;
  window.process = window.process ?? {};
  window.process.type = 'renderer';

  let onSource = null;
  window.ipcRenderer = {
    send: (channel) => {
      if (channel === 'open-plugin-source-dialog') {
        setTimeout(() => onSource?.(null, { path: SOURCE }));
      }
    },
    on: (channel, handler) => {
      if (channel === 'returned-plugin-source') onSource = handler;
    },
    removeListener: (channel) => {
      if (channel === 'returned-plugin-source') onSource = null;
    },
  };

  return () => {
    delete window.ipcRenderer;
    if (hadProcess) {
      window.process.type = previousType;
    } else {
      delete window.process;
    }
  };
};

const meta = {
  component: InstallPluginDialog,
  tags: ['ai-generated'],
  args: {
    show: true,
    onClose: fn(),
    onInstalled: fn(),
    onRestartRequired: fn(),
    pluginsDir: '/Users/maker/gSender/plugins',
  },
  beforeEach: ({ msw }) => {
    msw.use(
      http.post('*/api/plugins/install/prepare', () =>
        HttpResponse.json({ ok: true, sessionId: 'session-1', plan: PLAN, log: PREPARE_LOG }),
      ),
      http.post('*/api/plugins/install/cancel', () => HttpResponse.json({ ok: true })),
    );
    return pretendDesktopApp();
  },
};

export default meta;

const dialog = async (canvasElement) =>
  within(await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Install a plugin' }));

const pickSource = async (modal, userEvent) => {
  await userEvent.click(modal.getByRole('button', { name: /From folder/ }));
  await modal.findByRole('button', { name: /^Install$/ });
};

export const WaitingForAPlugin = {
  play: async ({ canvasElement }) => {
    const modal = await dialog(canvasElement);
    await expect(modal.getByText('Waiting for a plugin…')).toBeVisible();
    await expect(modal.queryByTestId('install-activity-log')).toBeNull();
  },
};

export const ActivityLogAfterPicking = {
  play: async ({ canvasElement, userEvent }) => {
    const modal = await dialog(canvasElement);
    await pickSource(modal, userEvent);

    // What the server did while staging is on screen without asking for it
    const log = modal.getByTestId('install-activity-log');
    await expect(log).toBeVisible();
    await expect(within(log).getByText('Extracting demo-plugin.zip')).toBeVisible();
    await expect(within(log).getByText('Skipped 1 symlink entries')).toBeVisible();
  },
};

export const ActivityLogExplainsFailedInstall = {
  play: async ({ canvasElement, msw, userEvent }) => {
    msw.use(
      http.post('*/api/plugins/install/commit', () =>
        HttpResponse.json(
          {
            ok: false,
            error: 'Install failed: EPERM',
            restored: true,
            log: [
              { level: 'error', message: 'EPERM: operation not permitted, rename', at: 't3' },
              { level: 'info', message: 'Restored the previous version', at: 't4' },
            ],
          },
          { status: 500 },
        ),
      ),
    );
    const modal = await dialog(canvasElement);
    await pickSource(modal, userEvent);
    await userEvent.click(modal.getByRole('button', { name: /^Install$/ }));

    await expect(await modal.findByText(/Install failed: EPERM/)).toBeVisible();
    // The failure's own log follows the staging log
    const log = modal.getByTestId('install-activity-log');
    await waitFor(() => expect(log).toHaveTextContent('EPERM: operation not permitted, rename'));
    await expect(log).toHaveTextContent('Restored the previous version');
    await expect(log).toHaveTextContent('Extracting demo-plugin.zip');
  },
};
