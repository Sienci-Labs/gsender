import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { JogWheel } from '../components/JogWheel';
//------------------------------------ //
// --------------- Mocks -------------//
//------------------------------------ //

jest.mock('app/features/Jogging/utils/Jogging.ts', () => ({
    continuousJogAxis: jest.fn(),
    stopContinuousJog: jest.fn(),
    xMinusJog: jest.fn(),
    xMinusYMinus: jest.fn(),
    xMinusYPlus: jest.fn(),
    xPlusJog: jest.fn(),
    xPlusYMinus: jest.fn(),
    xPlusYPlus: jest.fn(),
    yMinusJog: jest.fn(),
    yPlusJog: jest.fn(),
}));

jest.mock('app/hooks/useWorkspaceState', () => ({
    useWorkspaceState: jest.fn(() => ({ mode: 'DEFAULT' })),
}));

jest.mock('use-long-press', () => ({
    useLongPress: jest.fn((callback, options) => {
        return () => ({
            onLongPress: callback,
            onCancel: options?.onCancel,
            onFinish: options?.onFinish,
        });
    }),
}));

jest.mock('app/constants', () => ({
    WORKSPACE_MODE: { ROTARY: 'ROTARY', DEFAULT: 'DEFAULT' },
}));

import {
    continuousJogAxis,
    stopContinuousJog,
    xPlusJog,
    xMinusJog,
    yPlusJog,
    yMinusJog,
    xPlusYPlus,
    xPlusYMinus,
    xMinusYPlus,
    xMinusYMinus,
} from 'app/features/Jogging/utils/Jogging.ts';

const defaultProps = {
    canClick: true,
    feedrate: 3000,
    distance: 10,
    threshold: 200,
};

//------------------------------------ //
// -------Test For  Rendering----------//
//------------------------------------ //

describe('JogWheel — rendering', () => {
    it('renders the SVG element', () => {
        const { container } = render(<JogWheel {...defaultProps} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders all 8 jog direction buttons', () => {
        render(<JogWheel {...defaultProps} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(8);
    });

    it('renders correct aria-labels for all directions', () => {
        render(<JogWheel {...defaultProps} />);
        expect(screen.getByLabelText('Jog X plus')).toBeInTheDocument();
        expect(screen.getByLabelText('Jog X minus')).toBeInTheDocument();
        expect(screen.getByLabelText('Jog Y plus')).toBeInTheDocument();
        expect(screen.getByLabelText('Jog Y minus')).toBeInTheDocument();
        expect(screen.getByLabelText('Jog X plus Y plus')).toBeInTheDocument();
        expect(screen.getByLabelText('Jog X plus Y minus')).toBeInTheDocument();
        expect(screen.getByLabelText('Jog X minus Y plus')).toBeInTheDocument();
        expect(screen.getByLabelText('Jog X minus Y minus')).toBeInTheDocument();
    });

    it('uses default threshold of 200 when not provided', () => {
    render(<JogWheel canClick={true} feedrate={3000} distance={10} />);
    expect(screen.getAllByRole('button')).toHaveLength(8);
});
});

//------------------------------------ //
// -------Test For canClick prop-------//
//------------------------------------ //

describe('JogWheel — canClick prop', () => {
    it('sets tabIndex=0 on xPlus when canClick is true', () => {
        render(<JogWheel {...defaultProps} canClick={true} />);
        expect(screen.getByLabelText('Jog X plus').tabIndex).toBe(0);
    });

    it('sets tabIndex=-1 on xPlus when canClick is false', () => {
        render(<JogWheel {...defaultProps} canClick={false} />);
        expect(screen.getByLabelText('Jog X plus').tabIndex).toBe(-1);
    });

    it('sets tabIndex=-1 on diagonal buttons in rotary mode', () => {
        const { useWorkspaceState } = require('app/hooks/useWorkspaceState');
        useWorkspaceState.mockReturnValue({ mode: 'ROTARY' });
        render(<JogWheel {...defaultProps} canClick={true} />);
        expect(screen.getByLabelText('Jog X plus Y plus').tabIndex).toBe(-1);
        expect(screen.getByLabelText('Jog Y plus').tabIndex).toBe(-1);
    });

    it('xMinus and xPlus still have tabIndex=0 in rotary mode', () => {
        const { useWorkspaceState } = require('app/hooks/useWorkspaceState');
        useWorkspaceState.mockReturnValue({ mode: 'ROTARY' });
        render(<JogWheel {...defaultProps} canClick={true} />);
        expect(screen.getByLabelText('Jog X plus').tabIndex).toBe(0);
        expect(screen.getByLabelText('Jog X minus').tabIndex).toBe(0);
    });
});

//------------------------------------ //
//-----Keyboard navigation ------------//
//------------------------------------ //

describe('JogWheel — keyboard navigation', () => {
    beforeEach(() => {
        const { useWorkspaceState } = require('app/hooks/useWorkspaceState');
        useWorkspaceState.mockReturnValue({ mode: 'DEFAULT' });
        (xPlusJog as jest.Mock).mockClear();
        (xMinusJog as jest.Mock).mockClear();
        (yPlusJog as jest.Mock).mockClear();
        (yMinusJog as jest.Mock).mockClear();
        (xPlusYPlus as jest.Mock).mockClear();
        (xPlusYMinus as jest.Mock).mockClear();
        (xMinusYPlus as jest.Mock).mockClear();
        (xMinusYMinus as jest.Mock).mockClear();
    });

    it('triggers xPlusJog on Enter key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog X plus'), { key: 'Enter' });
        expect(xPlusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers xPlusJog on Space key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog X plus'), { key: ' ' });
        expect(xPlusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers xMinusJog on Enter key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog X minus'), { key: 'Enter' });
        expect(xMinusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers yPlusJog on Enter key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog Y plus'), { key: 'Enter' });
        expect(yPlusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers yMinusJog on Enter key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog Y minus'), { key: 'Enter' });
        expect(yMinusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers xPlusYPlus on Enter key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog X plus Y plus'), { key: 'Enter' });
        expect(xPlusYPlus).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers xPlusYMinus on Enter key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog X plus Y minus'), { key: 'Enter' });
        expect(xPlusYMinus).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers xMinusYPlus on Enter key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog X minus Y plus'), { key: 'Enter' });
        expect(xMinusYPlus).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers xMinusYMinus on Enter key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog X minus Y minus'), { key: 'Enter' });
        expect(xMinusYMinus).toHaveBeenCalledWith(10, 3000, false);
    });

    it('does not trigger jog on unrelated key', () => {
        render(<JogWheel {...defaultProps} />);
        fireEvent.keyDown(screen.getByLabelText('Jog X plus'), { key: 'Tab' });
        expect(xPlusJog).not.toHaveBeenCalled();
    });
});

//------------------------------------ //
// -------Test For  Rotary mode ------//
//------------------------------------ //

describe('JogWheel — rotary mode', () => {
    beforeEach(() => {
        const { useWorkspaceState } = require('app/hooks/useWorkspaceState');
        useWorkspaceState.mockReturnValue({ mode: 'ROTARY' });
        (yPlusJog as jest.Mock).mockClear();
        (xPlusYPlus as jest.Mock).mockClear();
    });

    it('does not trigger yPlusJog on Enter in rotary mode (tabIndex -1)', () => {
        render(<JogWheel {...defaultProps} canClick={true} />);
        expect(screen.getByLabelText('Jog Y plus').tabIndex).toBe(-1);
    });

    it('xPlus still has tabIndex 0 in rotary mode', () => {
        render(<JogWheel {...defaultProps} canClick={true} />);
        expect(screen.getByLabelText('Jog X plus').tabIndex).toBe(0);
    });
});

//------------------------------------ //
// ---Test For LongPress callbacks ----//
//------------------------------------ //

describe('JogWheel — longPress callbacks', () => {
    const { useLongPress } = require('use-long-press');
    let capturedHandlers: Array<{ onLongPress: Function; onCancel: Function; onFinish: Function }>;

    beforeEach(() => {
        capturedHandlers = [];
        (useLongPress as jest.Mock).mockImplementation((callback: Function, options: any) => {
            return () => {
                const handler = {
                    onLongPress: callback,
                    onCancel: options?.onCancel,
                    onFinish: options?.onFinish,
                };
                capturedHandlers.push(handler);
                return {};
            };
        });

        (continuousJogAxis as jest.Mock).mockClear();
        (stopContinuousJog as jest.Mock).mockClear();
        (xPlusJog as jest.Mock).mockClear();
        (xMinusJog as jest.Mock).mockClear();
        (yPlusJog as jest.Mock).mockClear();
        (yMinusJog as jest.Mock).mockClear();
        (xPlusYPlus as jest.Mock).mockClear();
        (xPlusYMinus as jest.Mock).mockClear();
        (xMinusYPlus as jest.Mock).mockClear();
        (xMinusYMinus as jest.Mock).mockClear();

        const { useWorkspaceState } = require('app/hooks/useWorkspaceState');
        useWorkspaceState.mockReturnValue({ mode: 'DEFAULT' });
    });

    // handlers registered in component order:
    // 0: xPlus, 1: xMinus, 2: yPlus, 3: yMinus
    // 4: xPlusYMinus, 5: xPlusYPlus, 6: xMinusYPlus, 7: xMinusYMinus

    it('xPlus long press triggers continuousJogAxis with X:1', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[0].onLongPress();
        expect(continuousJogAxis).toHaveBeenCalledWith({ X: 1 }, 3000);
    });

    it('xPlus onCancel triggers xPlusJog short press', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[0].onCancel();
        expect(xPlusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('xPlus onFinish triggers stopContinuousJog', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[0].onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('xMinus long press triggers xMinusJog continuous', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[1].onLongPress();
        expect(xMinusJog).toHaveBeenCalledWith(1, 3000, true);
    });

    it('xMinus onCancel triggers xMinusJog short press', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[1].onCancel();
        expect(xMinusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('xMinus onFinish triggers stopContinuousJog', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[1].onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('yPlus long press triggers yPlusJog continuous', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[2].onLongPress();
        expect(yPlusJog).toHaveBeenCalledWith(1, 3000, true);
    });

    it('yPlus onCancel triggers yPlusJog short press', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[2].onCancel();
        expect(yPlusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('yPlus onFinish triggers stopContinuousJog', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[2].onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('yMinus long press triggers yMinusJog continuous', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[3].onLongPress();
        expect(yMinusJog).toHaveBeenCalledWith(1, 3000, true);
    });

    it('yMinus onCancel triggers yMinusJog short press', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[3].onCancel();
        expect(yMinusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('yMinus onFinish triggers stopContinuousJog', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[3].onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('xPlusYMinus long press triggers continuousJogAxis with X:1 Y:-1', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[4].onLongPress();
        expect(continuousJogAxis).toHaveBeenCalledWith({ X: 1, Y: -1 }, 3000);
    });

    it('xPlusYMinus onCancel triggers xPlusYMinus short press', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[4].onCancel();
        expect(xPlusYMinus).toHaveBeenCalledWith(10, 3000, false);
    });

    it('xPlusYMinus onFinish triggers stopContinuousJog', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[4].onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('xPlusYPlus long press triggers continuousJogAxis with X:1 Y:1', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[5].onLongPress();
        expect(continuousJogAxis).toHaveBeenCalledWith({ X: 1, Y: 1 }, 3000);
    });

    it('xPlusYPlus onCancel triggers xPlusYPlus short press', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[5].onCancel();
        expect(xPlusYPlus).toHaveBeenCalledWith(10, 3000, false);
    });

    it('xPlusYPlus onFinish triggers stopContinuousJog', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[5].onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('xMinusYPlus long press triggers continuousJogAxis with X:-1 Y:1', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[6].onLongPress();
        expect(continuousJogAxis).toHaveBeenCalledWith({ X: -1, Y: 1 }, 3000);
    });

    it('xMinusYPlus onCancel triggers xMinusYPlus short press', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[6].onCancel();
        expect(xMinusYPlus).toHaveBeenCalledWith(10, 3000, false);
    });

    it('xMinusYPlus onFinish triggers stopContinuousJog', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[6].onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('xMinusYMinus long press triggers continuousJogAxis with X:-1 Y:-1', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[7].onLongPress();
        expect(continuousJogAxis).toHaveBeenCalledWith({ X: -1, Y: -1 }, 3000);
    });

    it('xMinusYMinus onCancel triggers xMinusYMinus short press', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[7].onCancel();
        expect(xMinusYMinus).toHaveBeenCalledWith(10, 3000, false);
    });

    it('xMinusYMinus onFinish triggers stopContinuousJog', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers[7].onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('all 8 onFinish callbacks trigger stopContinuousJog', () => {
        render(<JogWheel {...defaultProps} />);
        capturedHandlers.forEach(h => h.onFinish());
        expect(stopContinuousJog).toHaveBeenCalledTimes(8);
    });
});
