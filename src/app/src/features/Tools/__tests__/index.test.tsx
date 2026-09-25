import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { PluginRecord } from 'app/features/Plugins/types';
import Tools from '../index';

// Everything below isolates the regression this test targets: with a STABLE
// toolsTabPlugins reference from usePlugins() (guaranteed by pluginStore.ts,
// covered separately in hooks/__tests__/pluginStore.test.ts), a plugin tab's
// iframe must survive an unrelated re-render of Tools instead of being torn
// down and remounted — see features/Tools/index.tsx's pluginTabs useMemo.

jest.mock('app/hooks/useWidgetState', () => ({
    useWidgetState: () => ({ tab: { show: true } }),
}));

jest.mock('app/hooks/useWorkspaceState', () => ({
    useWorkspaceState: () => ({
        spindleFunctions: true,
        coolantFunctions: true,
        atcEnabled: false,
        enableDarkMode: false,
    }),
}));

jest.mock('app/hooks/useTypedSelector.ts', () => ({
    useTypedSelector: () => undefined,
}));

jest.mock('app/features/ATC', () => ({ ATCWidget: () => <div>ATC</div> }));
jest.mock('../../Console', () => () => <div>Console</div>);
jest.mock('../../Coolant', () => () => <div>Coolant</div>);
jest.mock('../../Macros', () => () => <div>Macros</div>);
jest.mock('../../Probe', () => () => <div>Probe</div>);
jest.mock('../../Rotary', () => () => <div>Rotary</div>);
jest.mock('../../Spindle', () => () => <div>Spindle</div>);

jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
    },
}));

const mockPlugin: PluginRecord = {
    id: 'com.example.tab',
    name: 'Tab Plugin',
    version: '1.0.0',
    description: '',
    engine: null,
    capabilities: { requestTypes: [], topics: [], allowedFunctions: [] },
    permissions: [],
    enabled: true,
    valid: true,
    errors: [],
    mountSlug: 'tab-plugin',
    mountRoute: '/plugins/tab-plugin',
    uiUrl: '/plugins/tab-plugin/index.html',
    contributions: [{ slot: 'tools-tab', label: 'Tab Plugin' }],
};
// Same array reference on every call — this is the contract pluginStore.ts
// provides in the real app. Mocking usePlugins() directly (rather than the
// underlying store) isolates the thing this test is actually about: whether
// Tools' own useMemo correctly preserves tab identity given a stable input.
const mockToolsTabPlugins = [mockPlugin];
jest.mock('app/features/Plugins/hooks/usePlugins', () => ({
    usePlugins: () => ({ toolsTabPlugins: mockToolsTabPlugins }),
}));

const renderTools = () =>
    render(
        <MemoryRouter>
            <Tools />
        </MemoryRouter>,
    );

describe('Tools', () => {
    it('keeps the plugin tab iframe mounted across an unrelated re-render', () => {
        const { container, rerender } = renderTools();

        fireEvent.click(screen.getByRole('tab', { name: 'Tab Plugin' }));

        const firstIframe = container.querySelector('iframe');
        expect(firstIframe).not.toBeNull();

        // Simulate an unrelated re-render of the always-mounted Tools widget
        // (e.g. a redux/controller state update elsewhere in the app).
        rerender(
            <MemoryRouter>
                <Tools />
            </MemoryRouter>,
        );

        const secondIframe = container.querySelector('iframe');
        expect(secondIframe).toBe(firstIframe);
    });
});
