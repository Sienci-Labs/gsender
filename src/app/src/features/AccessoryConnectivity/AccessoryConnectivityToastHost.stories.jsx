import { expect, waitFor, within } from 'storybook/test';
import controller from 'app/lib/controller';
import rootSaga, { sagaMiddleware } from 'app/store/redux/sagas';

import { AccessoryConnectivityToastHost } from './AccessoryConnectivityToastHost';

// App.tsx starts the controller sagas, which compare grblHAL autoconfig reports
// against the accessories seen at startup. Start them once for this page.
let sagasStarted = false;
const startSagas = () => {
  if (!sagasStarted) {
    sagaMiddleware.run(rootSaga);
    sagasStarted = true;
  }
};

// Deliver a controller event to its listeners, as the socket handler does
const emit = (eventName, ...args) => {
  controller.listeners[eventName].forEach((listener) => listener(...args));
};

// Startup report: which accessories the firmware found ([NEWOPT:...])
const reportStartup = (newopt) => emit('grblHal:info', { name: 'NEWOPT', value: newopt });

// Runtime report when an accessory is plugged in or out ([MSG:Info: Autoconfig: ...])
const reportAutoconfig = (values) => emit('grblHal:autoconfig', { values });

const meta = {
  component: AccessoryConnectivityToastHost,
  tags: ['ai-generated'],
  // Machine state is applied by .storybook/machine-state.js
  parameters: { machine: { preset: 'idle' } },
  beforeEach: () => {
    startSagas();
    // Manage navigates the story's HashRouter; put it back afterwards
    const { hash } = window.location;
    return () => {
      window.location.hash = hash;
    };
  },
  decorators: [
    (Story) => (
      <div className="relative h-[320px] w-[640px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

const body = (canvasElement) => within(canvasElement.ownerDocument.body);

export const AccessoryPluggedIn = {
  play: async ({ canvasElement }) => {
    reportStartup({ TLS: '0', ATCEXP: '1' });
    reportAutoconfig({ TLS: '1' });

    await expect(await body(canvasElement).findByRole('article', { name: 'TLS connected' })).toBeVisible();
  },
};

export const AccessoryUnplugged = {
  play: async ({ canvasElement }) => {
    reportStartup({ ATCEXP: '1' });
    reportAutoconfig({ ATCEXP: '0' });
    await expect(await body(canvasElement).findByRole('article', { name: 'ATCEXP disconnected' })).toBeVisible();
  },
};

export const NoChangeNoToast = {
  play: async ({ canvasElement }) => {
    reportStartup({ PROBE: '1' });
    // Reporting the same state again, or a key that isn't an accessory, stays quiet
    reportAutoconfig({ PROBE: '1', SPINDLE: '1' });
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(body(canvasElement).queryByRole('article')).toBeNull();
  },
};

// The host is a click-through overlay, so the toast itself has to take clicks
export const DismissToast = {
  play: async ({ canvasElement, userEvent }) => {
    reportStartup({ TLS: '0' });
    reportAutoconfig({ TLS: '1' });
    const toast = within(await body(canvasElement).findByRole('article', { name: 'TLS connected' }));

    await userEvent.click(toast.getByRole('button', { name: 'Dismiss tls connected notification' }));
    await waitFor(() => expect(body(canvasElement).queryByRole('article')).toBeNull());
  },
};

export const ManageOpensAccessoryWizard = {
  play: async ({ canvasElement, userEvent }) => {
    reportStartup({ ATCEXP: '0' });
    reportAutoconfig({ ATCEXP: '1' });
    const toast = within(await body(canvasElement).findByRole('article', { name: 'ATCEXP connected' }));

    await userEvent.click(toast.getByRole('button', { name: /Manage/ }));
    await waitFor(() => expect(window.location.hash).toBe('#/tools/accessoryInstall/sienci-atc'));
    // Done with the toast once it has taken you there
    await expect(body(canvasElement).queryByRole('article')).toBeNull();
  },
};

export const ManageWithoutWizardOpensInstaller = {
  play: async ({ canvasElement, userEvent }) => {
    reportStartup({ PROBE: '0' });
    reportAutoconfig({ PROBE: '1' });
    const toast = within(await body(canvasElement).findByRole('article', { name: 'PROBE connected' }));

    await userEvent.click(toast.getByRole('button', { name: /Manage/ }));
    await waitFor(() => expect(window.location.hash).toBe('#/tools/accessoryInstall'));
  },
};
