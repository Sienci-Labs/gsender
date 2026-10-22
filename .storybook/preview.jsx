import '../src/app/src/index.css';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter } from 'react-router';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { store as reduxStore } from 'app/store/redux';
import appStore from 'app/store';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { mswHandlers } from './msw-handlers';
import { applyMachineState, applyWorkspaceState } from './machine-state';

// useWorkspaceState snapshots the workspace at import and only subscribes to
// app/store once a component using it mounts, so on a fresh page it would miss
// what beforeEach applies for the first story. Mount one subscriber up front.
function WorkspaceSubscriber() {
  useWorkspaceState();
  return null;
}
flushSync(() => createRoot(document.createElement('div')).render(<WorkspaceSubscriber />));

/** @type { import('@storybook/tanstack-react').Preview } */
const preview = {
  decorators: [
    // Same provider tree as src/app/src/App.tsx
    (Story) => (
      <ReduxProvider store={reduxStore}>
        <HashRouter>
          <Story />
        </HashRouter>
      </ReduxProvider>
    ),
  ],
  loaders: [mswLoader()],
  async beforeEach({ msw, parameters }) {
    msw.use(...mswHandlers);
    applyMachineState(reduxStore, parameters.machine);
    applyWorkspaceState(appStore, parameters.workspace);
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
