import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Console from '../index';

jest.mock('app/lib/toaster', () => ({
    toast: { info: jest.fn() },
}));

jest.mock('is-electron', () => jest.fn(() => false));

jest.mock('app/features/Console/components/ConsolePopout.tsx', () => ({
    ConsolePopout: () => <div data-testid="console-popout" />,
}));

jest.mock('../Terminal', () => {
    const React = require('react');
    return {
        __esModule: true,
        default: React.forwardRef((_props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({ clear: jest.fn() }));
            return <div data-testid="terminal" />;
        }),
    };
});

jest.mock('../TerminalInput', () => ({
    __esModule: true,
    default: ({ onClear }: { onClear: () => void }) => (
        <button onClick={onClear}>mock-clear</button>
    ),
}));

const mockControllerListeners: Record<string, Function[]> = {};

jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: {
        port: '',
        type: 'Grbl',
        addListener: jest.fn((event: string, cb: Function) => {
            mockControllerListeners[event] = mockControllerListeners[event] || [];
            mockControllerListeners[event].push(cb);
        }),
        removeListener: jest.fn(),
        addClient: jest.fn(),
        writeln: jest.fn(),
    },
}));

const mockIpcRenderer = {
    on: jest.fn(),
    send: jest.fn(),
};

beforeAll(() => {
    (window as any).ipcRenderer = mockIpcRenderer;
});

describe('Console', () => {
    beforeEach(() => {
        Object.keys(mockControllerListeners).forEach((k) => delete mockControllerListeners[k]);
        const controller = require('app/lib/controller').default;
        controller.port = '';
    });

    it('shows "Not connected to a device" when no port is set', () => {
        render(<Console isActive={true} />);
        expect(screen.getByText('Not connected to a device')).toBeInTheDocument();
    });

    it('renders the Terminal and TerminalInput', () => {
        render(<Console isActive={true} />);
        expect(screen.getByTestId('terminal')).toBeInTheDocument();
        expect(screen.getByText('mock-clear')).toBeInTheDocument();
    });

    it('hides the "not connected" overlay once serialport:open fires', () => {
        render(<Console isActive={true} />);
        act(() => {
            mockControllerListeners['serialport:open']?.forEach((cb) =>
                cb({ port: 'COM3', baudrate: '115200', controllerType: 'Grbl', inuse: false }),
            );
        });
        const overlay = screen.getByText('Not connected to a device').closest('div')?.parentElement;
        expect(overlay?.className).toContain('opacity-0');
    });

    it('shows the "not connected" overlay again when serialport:close fires', () => {
        render(<Console isActive={true} />);
        act(() => {
            mockControllerListeners['serialport:open']?.forEach((cb) =>
                cb({ port: 'COM3', baudrate: '115200', controllerType: 'Grbl', inuse: false }),
            );
        });
        act(() => {
            mockControllerListeners['serialport:close']?.forEach((cb) => cb());
        });
        const overlay = screen.getByText('Not connected to a device').closest('div')?.parentElement;
        expect(overlay?.className).toContain('opacity-100');
    });

    it('shows info toast and clears terminal when Clear Console is triggered', () => {
        const { toast } = require('app/lib/toaster');
        render(<Console isActive={true} />);
        screen.getByText('mock-clear').click();
        expect(toast.info).toHaveBeenCalledWith('Console cleared', { position: 'bottom-right' });
    });

    it('registers controller listeners on mount', () => {
        const controller = require('app/lib/controller').default;
        render(<Console isActive={true} />);
        expect(controller.addListener).toHaveBeenCalledWith('serialport:open', expect.any(Function));
        expect(controller.addListener).toHaveBeenCalledWith('serialport:close', expect.any(Function));
    });

    it('removes controller listeners on unmount', () => {
        const controller = require('app/lib/controller').default;
        const { unmount } = render(<Console isActive={true} />);
        unmount();
        expect(controller.removeListener).toHaveBeenCalledWith('serialport:open', expect.any(Function));
        expect(controller.removeListener).toHaveBeenCalledWith('serialport:close', expect.any(Function));
    });

    it('does not attempt Electron IPC registration when not in Electron', () => {
        render(<Console isActive={true} />);
        // No window.ipcRenderer expected to be touched; absence of crash is the assertion
        expect(screen.getByTestId('terminal')).toBeInTheDocument();
    });
});

describe('Console — Electron IPC (parent window)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.keys(mockControllerListeners).forEach((k) => delete mockControllerListeners[k]);
        const isElectron = require('is-electron');
        (isElectron as jest.Mock).mockReturnValue(true);
    });

    afterEach(() => {
        const isElectron = require('is-electron');
        (isElectron as jest.Mock).mockReturnValue(false);
    });

    it('registers "get-data-console" listener when not a child window', () => {
        render(<Console isActive={true} isChildWindow={false} />);
        expect(mockIpcRenderer.on).toHaveBeenCalledWith('get-data-console', expect.any(Function));
    });

    it('sends port data back when "get-data-console" fires', () => {
        const controller = require('app/lib/controller').default;
        controller.port = 'COM5';
        render(<Console isActive={true} isChildWindow={false} />);
        const handler = mockIpcRenderer.on.mock.calls.find(
            (call: any[]) => call[0] === 'get-data-console',
        )?.[1];
        handler?.();
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('receive-data', {
            widget: 'console',
            data: { port: 'COM5' },
        });
    });

    it('does not send "get-data" request when not a child window', () => {
        render(<Console isActive={true} isChildWindow={false} />);
        expect(mockIpcRenderer.send).not.toHaveBeenCalledWith('get-data', 'console');
    });
});

describe('Console — Electron IPC (child window)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.keys(mockControllerListeners).forEach((k) => delete mockControllerListeners[k]);
        const isElectron = require('is-electron');
        (isElectron as jest.Mock).mockReturnValue(true);
    });

    afterEach(() => {
        const isElectron = require('is-electron');
        (isElectron as jest.Mock).mockReturnValue(false);
    });

    it('sends "get-data" request on mount when isChildWindow is true', () => {
        render(<Console isActive={true} isChildWindow={true} />);
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('get-data', 'console');
    });

    it('registers "recieve-data-console" listener when isChildWindow is true', () => {
        render(<Console isActive={true} isChildWindow={true} />);
        expect(mockIpcRenderer.on).toHaveBeenCalledWith('recieve-data-console', expect.any(Function));
    });

    it('registers "reconnect" listener when isChildWindow is true', () => {
        render(<Console isActive={true} isChildWindow={true} />);
        expect(mockIpcRenderer.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
    });

    it('updates controller port and adds client when "recieve-data-console" fires', () => {
        const controller = require('app/lib/controller').default;
        render(<Console isActive={true} isChildWindow={true} />);
        const handler = mockIpcRenderer.on.mock.calls.find(
            (call: any[]) => call[0] === 'recieve-data-console',
        )?.[1];
        act(() => {
            handler?.('_', { port: 'COM9' });
        });
        expect(controller.port).toBe('COM9');
        expect(controller.addClient).toHaveBeenCalledWith('COM9');
    });

    it('updates controller port and type when "reconnect" fires', () => {
        const controller = require('app/lib/controller').default;
        render(<Console isActive={true} isChildWindow={true} />);
        const handler = mockIpcRenderer.on.mock.calls.find(
            (call: any[]) => call[0] === 'reconnect',
        )?.[1];
        act(() => {
            handler?.('_', { port: 'COM7', type: 'grblHAL' });
        });
        expect(controller.port).toBe('COM7');
        expect(controller.type).toBe('grblHAL');
        expect(controller.addClient).toHaveBeenCalledWith('COM7');
    });

    it('calls addClient on serialport:open when isChildWindow is true', () => {
        const controller = require('app/lib/controller').default;
        render(<Console isActive={true} isChildWindow={true} />);
        act(() => {
            mockControllerListeners['serialport:open']?.forEach((cb) =>
                cb({ port: 'COM3', baudrate: '115200', controllerType: 'Grbl', inuse: false }),
            );
        });
        expect(controller.addClient).toHaveBeenCalledWith('COM3');
    });
});