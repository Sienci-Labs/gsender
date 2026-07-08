/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JogInput } from 'app/features/Jogging/components/JogInput';

//------------------//
// Test for Mocks---//
//-----------------//
jest.mock('app/components/Button', () => ({
    __esModule: true,
    default: ({ onClick, icon, 'aria-label': ariaLabel }: any) => (
        <button onClick={onClick} aria-label={ariaLabel}>
            {icon}
        </button>
    ),
}));

jest.mock('app/components/ControlledInput', () => ({
    ControlledInput: ({ value, onChange, 'aria-label': ariaLabel }: any) => (
        <input
            type="number"
            value={value}
            onChange={onChange}
            aria-label={ariaLabel}
        />
    ),
}));

jest.mock('app/components/Label', () => ({
    Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock('app/lib/rounding', () => ({
    toFixedIfNecessary: (value: number, decimals: number) =>
        Number(value.toFixed(decimals)),
}));

jest.mock('react-icons/fa', () => ({
    FaMinus: () => <span>-</span>,
    FaPlus: () => <span>+</span>,
}));

const defaultProps = {
    label: 'XY',
    onChange: jest.fn(),
    currentValue: 10,
};

//-----------------------------//
// --- Test for Rendering-----//
//---------------------------//

describe('JogInput — rendering', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the label', () => {
        render(<JogInput {...defaultProps} />);
        expect(screen.getByText('XY')).toBeInTheDocument();
    });

    it('renders the input with correct value', () => {
        render(<JogInput {...defaultProps} />);
        expect(screen.getByRole('spinbutton')).toHaveValue(10);
    });

    it('renders increase and decrease buttons', () => {
        render(<JogInput {...defaultProps} />);
        expect(screen.getByLabelText('Increase XY')).toBeInTheDocument();
        expect(screen.getByLabelText('Decrease XY')).toBeInTheDocument();
    });

    it('uses screenReaderLabel for aria labels when provided', () => {
        render(<JogInput {...defaultProps} screenReaderLabel="Step Distance" />);
        expect(screen.getByLabelText('Increase Step Distance')).toBeInTheDocument();
        expect(screen.getByLabelText('Decrease Step Distance')).toBeInTheDocument();
    });

    it('uses label for aria label when screenReaderLabel is not provided', () => {
        render(<JogInput {...defaultProps} />);
        expect(screen.getByLabelText('XY')).toBeInTheDocument();
    });
});

//------------------------------------//
//--- Test for  onChange behavior----//
//----------------------------------//

describe('JogInput — onChange behavior', () => {
    let onChange: jest.Mock;

    beforeEach(() => {
        onChange = jest.fn();
        jest.clearAllMocks();
    });

    it('calls onChange when input value changes', () => {
        render(<JogInput {...defaultProps} onChange={onChange} />);
        fireEvent.change(screen.getByRole('spinbutton'), {
            target: { value: '5' },
        });
        expect(onChange).toHaveBeenCalledWith(5);
    });

    it('calls onChange with 0 when input is cleared', () => {
        render(<JogInput {...defaultProps} onChange={onChange} />);
        fireEvent.change(screen.getByRole('spinbutton'), {
            target: { value: '0' },
        });
        expect(onChange).toHaveBeenCalledWith(0);
    });
});

//-------------------------------------------------//
//----------Test for Increment button -------------//
//-------------------------------------------------//

describe('JogInput — increment button', () => {
    let onChange: jest.Mock;

    beforeEach(() => {
        onChange = jest.fn();
        jest.clearAllMocks();
    });

    it('increments from 0 by 0.1', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={0} />);
        fireEvent.click(screen.getByLabelText('Increase XY'));
        expect(onChange).toHaveBeenCalledWith(0.1);
    });

    it('increments from 0.01 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={0.01} />);
        fireEvent.click(screen.getByLabelText('Increase XY'));
        expect(onChange).toHaveBeenCalledWith(0.02);
    });

    it('increments from 0.5 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={0.5} />);
        fireEvent.click(screen.getByLabelText('Increase XY'));
        expect(onChange).toHaveBeenCalledWith(0.6);
    });

    it('increments from 1 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={1} />);
        fireEvent.click(screen.getByLabelText('Increase XY'));
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it('increments from 10 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={10} />);
        fireEvent.click(screen.getByLabelText('Increase XY'));
        expect(onChange).toHaveBeenCalledWith(20);
    });

    it('increments from 100 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={100} />);
        fireEvent.click(screen.getByLabelText('Increase XY'));
        expect(onChange).toHaveBeenCalledWith(200);
    });

  it('increments from 110 correctly', () => {
    render(<JogInput {...defaultProps} onChange={onChange} currentValue={110} />);
    fireEvent.click(screen.getByLabelText('Increase XY'));
    expect(onChange).toHaveBeenCalledWith(210);
});

it('increments from 150 correctly using floor rounding', () => {
    render(<JogInput {...defaultProps} onChange={onChange} currentValue={150} />);
    fireEvent.click(screen.getByLabelText('Increase XY'));
    expect(onChange).toHaveBeenCalledWith(250);
});
    it('increments from 5 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={5} />);
        fireEvent.click(screen.getByLabelText('Increase XY'));
        expect(onChange).toHaveBeenCalledWith(6);
    });
});
//-------------------------------------------------//
// ------Test for Decrement button ----------------//
//-------------------------------------------------//
describe('JogInput — decrement button', () => {
    let onChange: jest.Mock;

    beforeEach(() => {
        onChange = jest.fn();
        jest.clearAllMocks();
    });

    it('does not decrement below 0 when value is 0', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={0} />);
        fireEvent.click(screen.getByLabelText('Decrease XY'));
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('decrements from 0.02 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={0.02} />);
        fireEvent.click(screen.getByLabelText('Decrease XY'));
        expect(onChange).toHaveBeenCalledWith(0.01);
    });

    it('decrements from 0.01 to minimum step', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={0.01} />);
        fireEvent.click(screen.getByLabelText('Decrease XY'));
        expect(onChange).toHaveBeenCalledWith(0.009);
    });

    it('decrements from 1 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={1} />);
        fireEvent.click(screen.getByLabelText('Decrease XY'));
        expect(onChange).toHaveBeenCalledWith(0.9);
    });

  it('decrements from 10 correctly', () => {
    render(<JogInput {...defaultProps} onChange={onChange} currentValue={10} />);
    fireEvent.click(screen.getByLabelText('Decrease XY'));
    expect(onChange).toHaveBeenCalledWith(9);
});

    it('decrements from 110 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={110} />);
        fireEvent.click(screen.getByLabelText('Decrease XY'));
        expect(onChange).toHaveBeenCalledWith(100);
    });

   it('decrements from 210 correctly', () => {
    render(<JogInput {...defaultProps} onChange={onChange} currentValue={210} />);
    fireEvent.click(screen.getByLabelText('Decrease XY'));
    expect(onChange).toHaveBeenCalledWith(110);
});

it('returns 0 step when value would go below 0.001', () => {
    render(<JogInput {...defaultProps} onChange={onChange} currentValue={0.001} />);
    fireEvent.click(screen.getByLabelText('Decrease XY'));
    expect(onChange).toHaveBeenCalledWith(0.001); // step = 0, no change
});

    it('decrements from 5 correctly', () => {
        render(<JogInput {...defaultProps} onChange={onChange} currentValue={5} />);
        fireEvent.click(screen.getByLabelText('Decrease XY'));
        expect(onChange).toHaveBeenCalledWith(4);

});
});