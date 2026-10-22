import './isolate-storage';
import '../src/app/src/index.css';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter } from 'react-router';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { store as reduxStore } from 'app/store/redux';
import appStore from 'app/store';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { useWidgetState } from 'app/hooks/useWidgetState';
import { Toaster } from 'app/components/shadcn/Sonner';
import ConfirmationDialog from 'app/components/ConfirmationDialog/ConfirmationDialog';
import { SettingsProvider } from 'app/features/Config/utils/SettingsContext';
import { mswHandlers } from './msw-handlers';
import { applyAppState, applyMachineState } from './machine-state';

// useWorkspaceState and useWidgetState snapshot app/store at import and only
// subscribe once a component using them mounts, so on a fresh page they would
// miss what beforeEach applies for the first story. Mount subscribers up front.
function StoreSubscribers() {
  useWorkspaceState();
  useWidgetState('rotary');
  return null;
}
flushSync(() => createRoot(document.createElement('div')).render(<StoreSubscribers />));

/** @type { import('@storybook/tanstack-react').Preview } */
const preview = {
  decorators: [
    // Same provider tree as src/app/src/App.tsx, plus what workspace/index.tsx wraps
    // every page in: SettingsProvider and the ConfirmationDialog that renders
    // Confirm() requests published over pubsub
    (Story) => (
      <ReduxProvider store={reduxStore}>
        <Toaster richColors closeButton theme="light" visibleToasts={5} />
        <HashRouter>
          <SettingsProvider>
            <ConfirmationDialog />
            <Story />
          </SettingsProvider>
        </HashRouter>
      </ReduxProvider>
    ),
  ],
  loaders: [mswLoader()],
  async beforeEach({ msw, parameters }) {
    msw.use(...mswHandlers);
    applyMachineState(reduxStore, parameters.machine);
    applyAppState(appStore, parameters);
  },
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    }
  },
};

export default preview;
