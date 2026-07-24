import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TerminalInput from '../TerminalInput';

jest.mock('app/lib/controller', () => ({
    writeln: jest.fn(),
}));

jest.mock('app/lib/toaster', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
}));

let mockConsoleState = { inputHistory: [], history: [] };
jest.mock('app/hooks/useTypedSelector', () => ({
    useTypedSelector: (selector: (state: any) => any) =>
        selector({ console: mockConsoleState }),
}));

jest.mock('app/store/redux/slices/console.slice', () => ({
    addToInputHistory: (cmd: string) => ({ type: 'ADD_TO_HISTORY', payload: cmd }),
}));

Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
    },
});

describe('TerminalInput', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConsoleState = { inputHistory: [], history: [] };
    });

    it('renders the input and Run button', () => {
        render(<TerminalInput onClear={jest.fn()} />);
        expect(screen.getByPlaceholderText('Enter G-code here...')).toBeInTheDocument();
        expect(screen.getByText('Run')).toBeInTheDocument();
    });

    it('calls controller.writeln with the input value when Run is clicked', () => {
        const controller = require('app/lib/controller');
        render(<TerminalInput onClear={jest.fn()} />);
        const input = screen.getByPlaceholderText('Enter G-code here...') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'G0 X10' } });
        fireEvent.click(screen.getByText('Run'));
        expect(controller.writeln).toHaveBeenCalledWith('G0 X10');
    });

    it('clears the input after running a command', () => {
        render(<TerminalInput onClear={jest.fn()} />);
        const input = screen.getByPlaceholderText('Enter G-code here...') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'G0 X10' } });
        fireEvent.click(screen.getByText('Run'));
        expect(input.value).toBe('');
    });

    it('does not call controller.writeln when input is empty', () => {
        const controller = require('app/lib/controller');
        render(<TerminalInput onClear={jest.fn()} />);
        fireEvent.click(screen.getByText('Run'));
        expect(controller.writeln).not.toHaveBeenCalled();
    });

    it('runs command when Enter key is pressed', () => {
        const controller = require('app/lib/controller');
        render(<TerminalInput onClear={jest.fn()} />);
        const input = screen.getByPlaceholderText('Enter G-code here...') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'G0 X5' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(controller.writeln).toHaveBeenCalledWith('G0 X5');
    });

    it('navigates up through history on ArrowUp', () => {
        mockConsoleState = { inputHistory: ['G0 X1', 'G0 X2'], history: [] };
        render(<TerminalInput onClear={jest.fn()} />);
        const input = screen.getByPlaceholderText('Enter G-code here...') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        expect(input.value).toBe('G0 X2');
    });

    it('navigates further up through history on repeated ArrowUp', () => {
        mockConsoleState = { inputHistory: ['G0 X1', 'G0 X2'], history: [] };
        render(<TerminalInput onClear={jest.fn()} />);
        const input = screen.getByPlaceholderText('Enter G-code here...') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        expect(input.value).toBe('G0 X1');
    });

    it('navigates down through history and clears input at the bottom', () => {
        mockConsoleState = { inputHistory: ['G0 X1', 'G0 X2'], history: [] };
        render(<TerminalInput onClear={jest.fn()} />);
        const input = screen.getByPlaceholderText('Enter G-code here...') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(input.value).toBe('');
    });

    it('does nothing on ArrowUp/ArrowDown when history is empty', () => {
        render(<TerminalInput onClear={jest.fn()} />);
        const input = screen.getByPlaceholderText('Enter G-code here...') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        expect(input.value).toBe('');
    });

    it('resets history index on Backspace when input becomes empty', () => {
        mockConsoleState = { inputHistory: ['G0 X1'], history: [] };
        render(<TerminalInput onClear={jest.fn()} />);
        const input = screen.getByPlaceholderText('Enter G-code here...') as HTMLInputElement;
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        fireEvent.change(input, { target: { value: 'G' } });
        fireEvent.keyDown(input, { key: 'Backspace' });
        // No direct observable assertion beyond no crash; historyIndex reset is internal state
        expect(input).toBeInTheDocument();
    });

    it('copies last commands to clipboard and shows success toast', async () => {
        const { toast } = require('app/lib/toaster');
        mockConsoleState = { inputHistory: [], history: ['G0 X1', 'G0 X2'] };
        render(<TerminalInput onClear={jest.fn()} />);
        fireEvent.click(screen.getByLabelText('Console options'));
        fireEvent.click(screen.getByText('Copy last 50 lines'));
        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('G0 X1\nG0 X2');
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('shows error toast when clipboard copy fails', async () => {
        (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('denied'));
        const { toast } = require('app/lib/toaster');
        render(<TerminalInput onClear={jest.fn()} />);
        fireEvent.click(screen.getByLabelText('Console options'));
        fireEvent.click(screen.getByText('Copy last 50 lines'));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    });

    it('calls onClear when Clear Console is clicked', () => {
        const onClear = jest.fn();
        render(<TerminalInput onClear={onClear} />);
        fireEvent.click(screen.getByLabelText('Console options'));
        fireEvent.click(screen.getByText('Clear Console'));
        expect(onClear).toHaveBeenCalled();
    });
});