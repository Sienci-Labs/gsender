import { act, fireEvent, render, screen } from '@testing-library/react';
import type { PluginRecord } from 'app/features/Plugins/types';
import store from 'app/store';
import { MemoryRouter, Route, Routes } from 'react-router';
import ToolsPage from '../tools';

// Back the page with a real ImmutableStore so array removal semantics
// (the reason tools.tsx uses replace rather than set) are exercised.
jest.mock('app/store', () => {
    const ImmutableStore = jest.requireActual(
        'app/lib/immutable-store',
    ).default;
    return {
        __esModule: true,
        default: new ImmutableStore({ workspace: { pinnedTools: [] } }),
    };
});

jest.mock('app/hooks/useWorkspaceState', () => {
    const { useEffect, useState } = jest.requireActual('react');
    const mockStore = jest.requireMock('app/store').default;
    return {
        useWorkspaceState: () => {
            const [workspace, setWorkspace] = useState(
                mockStore.get('workspace'),
            );
            useEffect(() => {
                const onChange = (state) => setWorkspace(state.workspace);
                mockStore.on('change', onChange);
                return () => mockStore.removeListener('change', onChange);
            }, []);
            return workspace;
        },
    };
});

const setPinned = (pinned: string[]) =>
    act(() => {
        store.replace('workspace.pinnedTools', pinned);
    });

const mockPlugin: PluginRecord = {
    id: 'com.example.zeta',
    name: 'Zeta Plugin',
    version: '1.0.0',
    description: '',
    engine: null,
    capabilities: { requestTypes: [], topics: [], allowedFunctions: [] },
    permissions: [],
    enabled: true,
    valid: true,
    errors: [],
    mountSlug: 'zeta',
    mountRoute: '/plugins/zeta',
    uiUrl: '/plugins/zeta/index.html',
    contributions: [
        { slot: 'tools-page', label: 'Alpha Plugin', route: 'zeta' },
    ],
};
const mockToolsPagePlugins = [mockPlugin];
jest.mock('app/features/Plugins/hooks/usePlugins', () => ({
    usePlugins: () => ({ toolsPagePlugins: mockToolsPagePlugins }),
}));

const renderTools = () =>
    render(
        <MemoryRouter initialEntries={['/tools']}>
            <Routes>
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="*" element={<div>Navigated away</div>} />
            </Routes>
        </MemoryRouter>,
    );

const cardTitles = () =>
    screen
        .getAllByRole('link')
        .map((link) => link.querySelector('h3, p')?.textContent);

describe('ToolsPage pinning', () => {
    beforeEach(() => {
        store.replace('workspace.pinnedTools', []);
    });

    it('keeps the default order when nothing is pinned', () => {
        renderTools();
        const titles = cardTitles();
        expect(titles[0]).toBe('Surfacing');
        expect(titles[titles.length - 1]).toBe('Alpha Plugin');
    });

    it('shows pinned tools first, alphabetically, including plugins', () => {
        setPinned(['squaring', 'plugin:com.example.zeta', 'gamepad']);
        renderTools();
        expect(cardTitles().slice(0, 4)).toEqual([
            'Alpha Plugin',
            'Gamepad',
            'XY Squaring',
            'Surfacing',
        ]);
    });

    it('pins and unpins repeatedly without navigating', () => {
        renderTools();

        const pin = (title: string) =>
            fireEvent.click(
                screen
                    .getByText(title)
                    .closest('a')
                    ?.querySelector('button') as HTMLButtonElement,
            );

        pin('Gamepad');
        pin('Surfacing');
        pin('Alpha Plugin');
        expect(store.get('workspace.pinnedTools')).toEqual([
            'gamepad',
            'surfacing',
            'plugin:com.example.zeta',
        ]);
        expect(cardTitles().slice(0, 3)).toEqual([
            'Alpha Plugin',
            'Gamepad',
            'Surfacing',
        ]);

        // Unpin from the middle, then the rest — each must take effect
        pin('Surfacing');
        expect(store.get('workspace.pinnedTools')).toEqual([
            'gamepad',
            'plugin:com.example.zeta',
        ]);
        expect(cardTitles().slice(0, 3)).toEqual([
            'Alpha Plugin',
            'Gamepad',
            'Surfacing',
        ]);

        pin('Gamepad');
        pin('Alpha Plugin');
        expect(store.get('workspace.pinnedTools')).toEqual([]);
        expect(cardTitles()[0]).toBe('Surfacing');
        expect(screen.queryByRole('button', { name: 'Unpin tool' })).toBeNull();

        expect(screen.queryByText('Navigated away')).toBeNull();
    });
});
