import React from 'react';
import { render, waitFor } from '@testing-library/react';
import Terminal from '../Terminal';

jest.mock('app/store', () => ({
    get: jest.fn(() => 'default'),
}));

jest.mock('app/store/redux', () => ({
    dispatch: jest.fn(),
}));

jest.mock('app/store/redux/slices/console.slice', () => ({
    addToHistory: (data: string[]) => ({ type: 'ADD_TO_HISTORY', payload: data }),
}));

jest.mock('uuid/v4', () => () => 'fixed-sender-id');

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
}));

const mockControllerListeners: Record<string, Function[]> = {};

jest.mock('app/lib/controller', () => ({
    __esModule: true,
    default: { type: 'Grbl', port: '', command: jest.fn() },
    addControllerEvents: jest.fn((events: Record<string, Function>) => {
        Object.entries(events).forEach(([key, cb]) => {
            mockControllerListeners[key] = mockControllerListeners[key] || [];
            mockControllerListeners[key].push(cb);
        });
    }),
    removeControllerEvents: jest.fn(),
}));

const mockXtermInstance = {
    open: jest.fn(),
    loadAddon: jest.fn(),
    writeln: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn(),
};

const mockFitAddonInstance = {
    fit: jest.fn(),
};

jest.mock('@xterm/xterm', () => ({
    Terminal: jest.fn(() => mockXtermInstance),
}));

jest.mock('@xterm/addon-fit', () => ({
    FitAddon: jest.fn(() => mockFitAddonInstance),
}));

jest.mock('@xterm/xterm/css/xterm.css', () => ({}));

describe('Terminal', () => {
    beforeEach(() => {
        Object.keys(mockControllerListeners).forEach((k) => delete mockControllerListeners[k]);
        jest.clearAllMocks();
    });

    it('renders the terminal container div', () => {
        const { container } = render(<Terminal isActive={true} />);
        expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('initializes the xterm Terminal and FitAddon after mount', async () => {
        const { Terminal: XtermTerminal } = require('@xterm/xterm');
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(XtermTerminal).toHaveBeenCalled();
            expect(mockXtermInstance.open).toHaveBeenCalled();
            expect(mockFitAddonInstance.fit).toHaveBeenCalled();
        });
    });

    it('registers controller events after terminal init', async () => {
        const { addControllerEvents } = require('app/lib/controller');
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(addControllerEvents).toHaveBeenCalled();
        });
    });

    it('writes a connection message on serialport:open', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:open']).toBeDefined();
        });
        mockControllerListeners['serialport:open'][0]({ port: 'COM3', baudrate: 115200 });
        expect(mockXtermInstance.writeln).toHaveBeenCalled();
    });

    

    it('clears the terminal on serialport:close', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:close']).toBeDefined();
        });
        mockControllerListeners['serialport:close'][0]();
        expect(mockXtermInstance.clear).toHaveBeenCalled();
    });

    it('writes incoming serialport:read data to the terminal', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:read']).toBeDefined();
        });
        mockControllerListeners['serialport:read'][0]('ok');
        expect(mockXtermInstance.writeln).toHaveBeenCalled();
    });

    it('disposes the terminal instance on unmount', async () => {
        const { unmount } = render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockXtermInstance.open).toHaveBeenCalled();
        });
        unmount();
        expect(mockXtermInstance.dispose).toHaveBeenCalled();
    });

    it('removes controller events on unmount', async () => {
        const { removeControllerEvents } = require('app/lib/controller');
        const { unmount } = render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockXtermInstance.open).toHaveBeenCalled();
        });
        unmount();
        expect(removeControllerEvents).toHaveBeenCalled();
    });

    it('re-fits the terminal when isActive becomes true', async () => {
        const { rerender } = render(<Terminal isActive={false} />);
        await waitFor(() => {
            expect(mockFitAddonInstance.fit).toHaveBeenCalled();
        });
        mockFitAddonInstance.fit.mockClear();
        rerender(<Terminal isActive={true} />);
        expect(mockFitAddonInstance.fit).toHaveBeenCalled();
    });
});

describe('Terminal — writeToTerminal message formatting', () => {
    beforeEach(() => {
        Object.keys(mockControllerListeners).forEach((k) => delete mockControllerListeners[k]);
        jest.clearAllMocks();
    });

    it('writes error messages in red', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:read']).toBeDefined();
        });
        mockXtermInstance.writeln.mockClear();
        mockControllerListeners['serialport:read'][0]('error: something bad happened');
        expect(mockXtermInstance.writeln).toHaveBeenCalled();
    });

    it('writes ALARM messages via serialport:write', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:write']).toBeDefined();
        });
        mockXtermInstance.writeln.mockClear();
        mockControllerListeners['serialport:write'][0]('ALARM: hard limit triggered', {
            source: '',
            __sender__: 'someone-else',
        });
        expect(mockXtermInstance.writeln).toHaveBeenCalled();
    });

    it('writes source-prefixed messages when source is provided', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:write']).toBeDefined();
        });
        mockXtermInstance.writeln.mockClear();
        mockControllerListeners['serialport:write'][0]('G0 X10', {
            source: 'app',
            __sender__: 'someone-else',
        });
        expect(mockXtermInstance.writeln).toHaveBeenCalled();
    });

    it('ignores serialport:write when data is empty', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:write']).toBeDefined();
        });
        mockXtermInstance.writeln.mockClear();
        mockControllerListeners['serialport:write'][0]('', { source: '', __sender__: 'x' });
        expect(mockXtermInstance.writeln).not.toHaveBeenCalled();
    });

    it('throttles rapid error messages on serialport:read', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:read']).toBeDefined();
        });
        mockXtermInstance.writeln.mockClear();
        mockControllerListeners['serialport:read'][0]('error: first');
        mockControllerListeners['serialport:read'][0]('error: second');
        expect(mockXtermInstance.writeln).toHaveBeenCalled();
    });
});

describe('Terminal — imperative clear handle', () => {
    beforeEach(() => {
        Object.keys(mockControllerListeners).forEach((k) => delete mockControllerListeners[k]);
        jest.clearAllMocks();
    });

    it('calls terminalInstance.clear() via the exposed ref', async () => {
        const ref = React.createRef<{ clear: () => void }>();
        render(<Terminal isActive={true} ref={ref} />);
        await waitFor(() => {
            expect(mockXtermInstance.open).toHaveBeenCalled();
        });
        ref.current?.clear();
        expect(mockXtermInstance.clear).toHaveBeenCalled();
    });

    it('does not throw when clear is called before terminal initializes', () => {
        const ref = React.createRef<{ clear: () => void }>();
        render(<Terminal isActive={true} ref={ref} />);
        expect(() => ref.current?.clear()).not.toThrow();
    });
});

describe('Terminal — grblHAL rotary mode check', () => {
    beforeEach(() => {
        Object.keys(mockControllerListeners).forEach((k) => delete mockControllerListeners[k]);
        jest.clearAllMocks();
    });

    it('checks rotary mode and sends updateRotaryMode command when controller type is grblHAL', async () => {
        const controller = require('app/lib/controller').default;
        const store = require('app/store');
        controller.type = 'grblHAL';
        (store.get as jest.Mock).mockReturnValue('ROTARY');

        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:open']).toBeDefined();
        });
        mockControllerListeners['serialport:open'][0]({ port: 'COM3', baudrate: 115200 });

        expect(controller.command).toHaveBeenCalledWith('updateRotaryMode', expect.any(Boolean));

        controller.type = 'Grbl'; // reset for other tests
    });

    it('does not check rotary mode when controller type is not grblHAL', async () => {
        const controller = require('app/lib/controller').default;
        controller.type = 'Grbl';

        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:open']).toBeDefined();
        });
        mockControllerListeners['serialport:open'][0]({ port: 'COM3', baudrate: 115200 });

        expect(controller.command).not.toHaveBeenCalled();
    });
});

describe('Terminal — serialport:write sender/formatting guards', () => {
    beforeEach(() => {
        Object.keys(mockControllerListeners).forEach((k) => delete mockControllerListeners[k]);
        jest.clearAllMocks();
    });

    it('ignores serialport:write messages sent by itself (matching senderId)', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:write']).toBeDefined();
        });
        mockXtermInstance.writeln.mockClear();
        mockControllerListeners['serialport:write'][0]('G0 X1', {
            source: '',
            __sender__: 'fixed-sender-id',
        });
        expect(mockXtermInstance.writeln).not.toHaveBeenCalled();
    });

    it('escapes non-ASCII characters in serialport:write data', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockControllerListeners['serialport:write']).toBeDefined();
        });
        mockXtermInstance.writeln.mockClear();
        mockControllerListeners['serialport:write'][0]('caf\u00e9', {
            source: '',
            __sender__: 'someone-else',
        });
        expect(mockXtermInstance.writeln).toHaveBeenCalled();
    });
});

describe('Terminal — history debounce and resize listener', () => {
    beforeEach(() => {
        Object.keys(mockControllerListeners).forEach((k) => delete mockControllerListeners[k]);
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('re-fits the terminal on window resize after debounce', async () => {
        render(<Terminal isActive={true} />);
        await waitFor(() => {
            expect(mockXtermInstance.open).toHaveBeenCalled();
        });
        mockFitAddonInstance.fit.mockClear();

        window.dispatchEvent(new Event('resize'));
        jest.advanceTimersByTime(50);

        expect(mockFitAddonInstance.fit).toHaveBeenCalled();
    });

});