import { act, renderHook } from '@testing-library/react';
import store from 'app/store';
import { usePinnedTools } from '../usePinnedTools';

// Real ImmutableStore so replace semantics are exercised, as in tools.test.tsx
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

jest.mock('app/features/Plugins/hooks/usePlugins', () => ({
    usePlugins: () => ({ toolsPagePlugins: [] }),
}));

const ids = (tools: { id: string }[]) => tools.map((tool) => tool.id);

describe('usePinnedTools', () => {
    beforeEach(() => {
        store.replace('workspace.pinnedTools', []);
    });

    it('hides keyboard and gamepad on the pendant and adds pendant-only tools', () => {
        const { result } = renderHook(() => usePinnedTools({ pendant: true }));
        const toolIds = ids(result.current.tools);
        expect(toolIds).not.toContain('keyboard-shortcuts');
        expect(toolIds).not.toContain('gamepad');
        expect(toolIds).toContain('remote-file-receive');
    });

    it('keeps keyboard and gamepad on desktop and drops pendant-only tools', () => {
        const { result } = renderHook(() => usePinnedTools({ pendant: false }));
        const toolIds = ids(result.current.tools);
        expect(toolIds).toContain('keyboard-shortcuts');
        expect(toolIds).toContain('gamepad');
        expect(toolIds).not.toContain('remote-file-receive');
    });

    it('never surfaces a hidden tool as pinned on the pendant', () => {
        store.replace('workspace.pinnedTools', ['gamepad', 'squaring', 'sd']);
        const { result } = renderHook(() => usePinnedTools({ pendant: true }));
        expect(ids(result.current.pinnedTools)).toEqual(['sd', 'squaring']);
        expect(ids(result.current.tools).slice(0, 2)).toEqual([
            'sd',
            'squaring',
        ]);
    });

    it('toggles pins', () => {
        const { result } = renderHook(() => usePinnedTools({ pendant: true }));
        act(() => result.current.togglePin('surfacing'));
        act(() => result.current.togglePin('remote-file-receive'));
        expect(ids(result.current.pinnedTools)).toEqual([
            'remote-file-receive',
            'surfacing',
        ]);
        act(() => result.current.togglePin('surfacing'));
        expect(store.get('workspace.pinnedTools')).toEqual([
            'remote-file-receive',
        ]);
    });
});
