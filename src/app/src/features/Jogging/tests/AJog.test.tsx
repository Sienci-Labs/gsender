/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AJog } from 'app/features/Jogging/components/AJog';
import {
    aPlusJog,
    aMinusJog,
    continuousJogAxis,
    stopContinuousJog,
} from 'app/features/Jogging/utils/Jogging';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const longPressCallbacks: any[] = [];

jest.mock('app/features/Jogging/utils/Jogging', () => ({
    aPlusJog: jest.fn(),
    aMinusJog: jest.fn(),
    continuousJogAxis: jest.fn(),
    stopContinuousJog: jest.fn(),
}));

jest.mock('use-long-press', () => ({
    useLongPress: jest.fn((callback, options) => {
        longPressCallbacks.push({ callback, options });
        return () => ({
            onMouseDown: jest.fn(),
            onMouseUp: jest.fn(),
            onTouchStart: jest.fn(),
            onTouchEnd: jest.fn(),
        });
    }),
}));

const defaultProps = {
    feedrate: 3000,
    distance: 10,
    canClick: true,
    isRotaryMode: false,
    threshold: 200,
};

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('AJog — rendering', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        longPressCallbacks.length = 0;
    });

    it('renders top and bottom jog buttons', () => {
        render(<AJog {...defaultProps} />);
        expect(screen.getByTestId('A+')).toBeInTheDocument();
        expect(screen.getByTestId('A-')).toBeInTheDocument();
    });

    it('renders with correct aria-labels for A axis in normal mode', () => {
        render(<AJog {...defaultProps} />);
        expect(screen.getByLabelText('Jog A plus')).toBeInTheDocument();
        expect(screen.getByLabelText('Jog A minus')).toBeInTheDocument();
    });

    it('renders with correct aria-labels for Y axis in rotary mode', () => {
        render(<AJog {...defaultProps} isRotaryMode={true} />);
        expect(screen.getByLabelText('Jog Y plus')).toBeInTheDocument();
        expect(screen.getByLabelText('Jog Y minus')).toBeInTheDocument();
    });

    it('renders container with correct id', () => {
        const { container } = render(<AJog {...defaultProps} />);
        expect(container.querySelector('#aJog')).toBeInTheDocument();
    });

    it('buttons are focusable when canClick is true', () => {
        render(<AJog {...defaultProps} canClick={true} />);
        expect(screen.getByTestId('A+')).toHaveAttribute('tabindex', '0');
        expect(screen.getByTestId('A-')).toHaveAttribute('tabindex', '0');
    });

    it('buttons are not focusable when canClick is false', () => {
        render(<AJog {...defaultProps} canClick={false} />);
        expect(screen.getByTestId('A+')).toHaveAttribute('tabindex', '-1');
        expect(screen.getByTestId('A-')).toHaveAttribute('tabindex', '-1');
    });
});

// ─── Long press behavior ──────────────────────────────────────────────────────

describe('AJog — long press behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        longPressCallbacks.length = 0;
    });

    it('calls continuousJogAxis with A+1 on long press of top button', () => {
        render(<AJog {...defaultProps} />);
        longPressCallbacks[0].callback();
        expect(continuousJogAxis).toHaveBeenCalledWith({ A: 1 }, 3000);
    });

    it('calls continuousJogAxis with A-1 on long press of bottom button', () => {
        render(<AJog {...defaultProps} />);
        longPressCallbacks[1].callback();
        expect(continuousJogAxis).toHaveBeenCalledWith({ A: -1 }, 3000);
    });

    it('calls continuousJogAxis with Y+1 in rotary mode on long press', () => {
        render(<AJog {...defaultProps} isRotaryMode={true} />);
        longPressCallbacks[0].callback();
        expect(continuousJogAxis).toHaveBeenCalledWith({ Y: 1 }, 3000);
    });

    it('calls continuousJogAxis with Y-1 in rotary mode on long press of bottom', () => {
        render(<AJog {...defaultProps} isRotaryMode={true} />);
        longPressCallbacks[1].callback();
        expect(continuousJogAxis).toHaveBeenCalledWith({ Y: -1 }, 3000);
    });

    it('calls aPlusJog on cancel (short press) of top button', () => {
        render(<AJog {...defaultProps} />);
        longPressCallbacks[0].options.onCancel();
        expect(aPlusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('calls aMinusJog on cancel (short press) of bottom button', () => {
        render(<AJog {...defaultProps} />);
        longPressCallbacks[1].options.onCancel();
        expect(aMinusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('calls stopContinuousJog on finish of top button', () => {
        render(<AJog {...defaultProps} />);
        longPressCallbacks[0].options.onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('calls stopContinuousJog on finish of bottom button', () => {
        render(<AJog {...defaultProps} />);
        longPressCallbacks[1].options.onFinish();
        expect(stopContinuousJog).toHaveBeenCalled();
    });

    it('passes correct threshold to useLongPress', () => {
        render(<AJog {...defaultProps} threshold={500} />);
        expect(longPressCallbacks[0].options.threshold).toBe(500);
    });
});

// ─── Function call arguments ──────────────────────────────────────────────────

describe('AJog — correct arguments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        longPressCallbacks.length = 0;
    });

    it('passes correct distance and feedrate to aPlusJog', () => {
        render(<AJog {...defaultProps} distance={25} feedrate={5000} />);
        longPressCallbacks[0].options.onCancel();
        expect(aPlusJog).toHaveBeenCalledWith(25, 5000, false);
    });

    it('passes correct distance and feedrate to aMinusJog', () => {
        render(<AJog {...defaultProps} distance={25} feedrate={5000} />);
        longPressCallbacks[1].options.onCancel();
        expect(aMinusJog).toHaveBeenCalledWith(25, 5000, false);
    });

    it('passes correct feedrate to continuousJogAxis', () => {
        render(<AJog {...defaultProps} feedrate={1500} />);
        longPressCallbacks[0].callback();
        expect(continuousJogAxis).toHaveBeenCalledWith({ A: 1 }, 1500);
    });
});

// ─── Keyboard behavior ────────────────────────────────────────────────────────

describe('AJog — keyboard behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        longPressCallbacks.length = 0;
    });

    it('triggers aPlusJog on Enter key on top button', () => {
        render(<AJog {...defaultProps} />);
        fireEvent.keyDown(screen.getByTestId('A+'), { key: 'Enter' });
        expect(aPlusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers aPlusJog on Space key on top button', () => {
        render(<AJog {...defaultProps} />);
        fireEvent.keyDown(screen.getByTestId('A+'), { key: ' ' });
        expect(aPlusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers aMinusJog on Enter key on bottom button', () => {
        render(<AJog {...defaultProps} />);
        fireEvent.keyDown(screen.getByTestId('A-'), { key: 'Enter' });
        expect(aMinusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('triggers aMinusJog on Space key on bottom button', () => {
        render(<AJog {...defaultProps} />);
        fireEvent.keyDown(screen.getByTestId('A-'), { key: ' ' });
        expect(aMinusJog).toHaveBeenCalledWith(10, 3000, false);
    });

    it('does not trigger jog on other keys', () => {
        render(<AJog {...defaultProps} />);
        fireEvent.keyDown(screen.getByTestId('A+'), { key: 'Tab' });
        expect(aPlusJog).not.toHaveBeenCalled();
    });

    it('uses default threshold of 200 when not provided', () => {
    render(<AJog feedrate={3000} distance={10} canClick={true} />);
    expect(longPressCallbacks[0].options.threshold).toBe(200);
});

    it('uses Y axis on Enter in rotary mode', () => {
        render(<AJog {...defaultProps} isRotaryMode={true} />);
        fireEvent.keyDown(screen.getByTestId('A+'), { key: 'Enter' });
        expect(aPlusJog).toHaveBeenCalledWith(10, 3000, false);
    });
});