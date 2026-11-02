import './isolate-storage';
import '../src/app/src/index.css';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter } from 'react-router';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { configure } from 'storybook/test';
import { store as reduxStore } from 'app/store/redux';
import appStore from 'app/store';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { useWidgetState } from 'app/hooks/useWidgetState';
import { Toaster } from 'app/components/shadcn/Sonner';
import ConfirmationDialog from 'app/components/ConfirmationDialog/ConfirmationDialog';
import { SettingsProvider } from 'app/features/Config/utils/SettingsContext';
import { mswHandlers } from './msw-handlers';
import { applyAppState, applyMachineState } from './machine-state';
import {
    argsEnhancers,
    argTypesEnhancers,
    stateFromArgs,
} from './machine-args';

// useWorkspaceState and useWidgetState snapshot app/store at import and only
// subscribe once a component using them mounts, so on a fresh page they would
// miss what beforeEach applies for the first story. Mount subscribers up front.
function StoreSubscribers() {
    useWorkspaceState();
    useWidgetState('rotary');
    return null;
}
flushSync(() =>
    createRoot(document.createElement('div')).render(<StoreSubscribers />),
);

// The full Vitest run renders many story files in parallel, so mocked requests,
// workers and dialog animations can take well over Testing Library's 1s default.
// Only failing waits get slower.
configure({ asyncUtilTimeout: 3000 });

/** @type { import('@storybook/tanstack-react').Preview } */
const preview = {
    // Generate a Docs page for every component from its stories, argTypes and JSDoc.
    // Feature stories set `docs.story.inline: false`: inline stories on one Docs
    // page share the Redux store and app/store, so each would show whatever state
    // the last story applied. In their own iframes each gets its own stores.
    tags: ['autodocs'],
    decorators: [
        // Same provider tree as src/app/src/App.tsx, plus what workspace/index.tsx wraps
        // every page in: SettingsProvider and the ConfirmationDialog that renders
        // Confirm() requests published over pubsub
        (Story) => (
            <ReduxProvider store={reduxStore}>
                <Toaster
                    richColors
                    closeButton
                    theme="light"
                    visibleToasts={5}
                />
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
    argTypesEnhancers,
    argsEnhancers,
    // Storybook re-runs this when args change, so the machine state controls
    // (see machine-args.js) take effect without remounting the story
    async beforeEach({ msw, parameters, argsByTarget }) {
        msw.use(...mswHandlers);
        const { machine, workspace } = stateFromArgs(parameters, argsByTarget);
        applyMachineState(reduxStore, machine);
        applyAppState(appStore, { ...parameters, workspace });
    },
    parameters: {
        controls: {
            // Show each prop's type, default and description beside its control
            expanded: true,
            sort: 'requiredFirst',
            // Event handlers can't be edited as values; pass fn() and watch Actions
            exclude: /^on[A-Z]/,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },

        a11y: {
            // 'todo' - show a11y violations in the test UI only
            // 'error' - fail CI on a11y violations
            // 'off' - skip a11y checks entirely
            test: 'todo',
        },
    },
};

export default preview;
