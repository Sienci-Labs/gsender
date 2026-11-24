const mockDispatch = jest.fn();
const mockReload = jest.fn();
let mockCommandKeys: Record<string, any> = {};

jest.mock('app/store/redux', () => ({
    __esModule: true,
    default: { dispatch: (...args: unknown[]) => mockDispatch(...args) },
}));

jest.mock('app/store/redux/slices/shortcuts.slice', () => ({
    updateShuttleStatus: (payload: unknown) => ({
        type: 'updateShuttleStatus',
        payload,
    }),
}));

jest.mock('../../store', () => ({
    __esModule: true,
    default: {
        get: (key: string, fallback: unknown) =>
            key === 'commandKeys' ? mockCommandKeys : fallback,
        replace: (key: string, value: any) => {
            if (key === 'commandKeys') {
                mockCommandKeys = value;
            }
        },
    },
}));

jest.mock('../combokeys', () => ({
    __esModule: true,
    default: { reload: () => mockReload() },
}));

import useKeybinding from '../useKeybinding';

const event = (cmd: string, keys: string) => ({
    [cmd]: {
        title: cmd,
        keys,
        cmd,
        preventDefault: false,
        isActive: true,
        category: 'General',
        callback: jest.fn(),
    },
});

describe('useKeybinding', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
        mockReload.mockClear();
        mockCommandKeys = {};
    });

    it('keeps user-edited shortcuts no matter how many widgets register before the root', () => {
        mockCommandKeys = {
            COPY: { cmd: 'COPY', keys: '', isActive: false },
            CONTROLLER_COMMAND_RESET: {
                cmd: 'CONTROLLER_COMMAND_RESET',
                keys: 'f9',
                isActive: true,
            },
        };

        for (let i = 0; i < 20; i++) {
            useKeybinding(event(`WIDGET_${i}`, `ctrl+${i}`));
        }
        expect(mockDispatch).not.toHaveBeenCalled();

        useKeybinding(
            {
                ...event('COPY', 'ctrl+c'),
                ...event('CONTROLLER_COMMAND_RESET', '%'),
            },
            { isRoot: true },
        );

        expect(mockCommandKeys.COPY).toEqual({
            cmd: 'COPY',
            keys: '',
            isActive: false,
        });
        expect(mockCommandKeys.CONTROLLER_COMMAND_RESET.keys).toBe('f9');
    });

    it('seeds defaults for shortcuts that are not saved yet', () => {
        useKeybinding(event('NEW_CMD', 'ctrl+n'), { isRoot: true });

        expect(mockCommandKeys.NEW_CMD).toEqual({
            cmd: 'NEW_CMD',
            keys: 'ctrl+n',
            isActive: true,
        });
    });

    it('only the root call finishes shortcut setup', () => {
        useKeybinding(event('A', 'a'));
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockReload).not.toHaveBeenCalled();

        useKeybinding(event('B', 'b'), { isRoot: true });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'updateShuttleStatus',
            payload: { isFinished: true },
        });
        expect(mockReload).toHaveBeenCalledTimes(1);
    });
});
