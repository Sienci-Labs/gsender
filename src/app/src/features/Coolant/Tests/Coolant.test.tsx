import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Coolant } from '../index';
import Connected from '../index';
import {
    startFlood,
    startMist,
    stopCoolant,
} from 'app/features/Coolant/utils/actions';

jest.mock('app/components/ActiveStateButton', () => ({
    ActiveStateButton: ({ text, onClick, active, disabled }: any) => (
        <button
            aria-label={text}
            aria-pressed={active ? 'true' : 'false'}
            disabled={disabled}
            onClick={onClick}
        >
            {text}
        </button>
    ),
}));

jest.mock('app/features/Coolant/utils/actions', () => ({
    startFlood: jest.fn(),
    startMist: jest.fn(),
    stopCoolant: jest.fn(),
}));

jest.mock('app/constants', () => ({
    GRBL: 'Grbl',
    GRBL_ACTIVE_STATE_IDLE: 'Idle',
    GRBLHAL: 'grblHAL',
    WORKFLOW_STATE_RUNNING: 'running',
}));

let mockSelectorState: any;

jest.mock('app/hooks/useTypedSelector', () => ({
    useTypedSelector: (selector: (state: any) => any) => selector(mockSelectorState),
}));

var capturedMapStateToProps: ((state: any) => any) | undefined;

jest.mock('react-redux', () => ({
    connect: (mapStateToProps: (state: any) => any) => {
        capturedMapStateToProps = mapStateToProps;
        return (Component: any) => Component;
    },
}));

const baseState = {
    controller: {
        workflow: { state: 'idle' },
        state: { status: { activeState: 'Idle' } },
        type: 'Grbl',
    },
    connection: { isConnected: true },
};

describe('Coolant', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSelectorState = JSON.parse(JSON.stringify(baseState));
    });

    it('renders Mist, Flood, and Off buttons', () => {
        render(<Coolant mistActive={false} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).toBeInTheDocument();
        expect(screen.getByLabelText('Flood')).toBeInTheDocument();
        expect(screen.getByLabelText('Off')).toBeInTheDocument();
    });

    it('enables buttons when connected, idle, and controller type is Grbl', () => {
        render(<Coolant mistActive={false} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).not.toBeDisabled();
        expect(screen.getByLabelText('Flood')).not.toBeDisabled();
        expect(screen.getByLabelText('Off')).not.toBeDisabled();
    });

    it('disables all buttons when not connected', () => {
        mockSelectorState.connection.isConnected = false;
        render(<Coolant mistActive={false} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).toBeDisabled();
        expect(screen.getByLabelText('Flood')).toBeDisabled();
        expect(screen.getByLabelText('Off')).toBeDisabled();
    });

    it('disables all buttons when workflow state is running', () => {
        mockSelectorState.controller.workflow.state = 'running';
        render(<Coolant mistActive={false} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).toBeDisabled();
        expect(screen.getByLabelText('Flood')).toBeDisabled();
        expect(screen.getByLabelText('Off')).toBeDisabled();
    });

    it('disables all buttons when controller type is not Grbl or grblHAL', () => {
        mockSelectorState.controller.type = 'TinyG';
        render(<Coolant mistActive={false} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).toBeDisabled();
        expect(screen.getByLabelText('Flood')).toBeDisabled();
        expect(screen.getByLabelText('Off')).toBeDisabled();
    });

    it('enables buttons when controller type is grblHAL', () => {
        mockSelectorState.controller.type = 'grblHAL';
        render(<Coolant mistActive={false} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).not.toBeDisabled();
    });

    it('disables all buttons when activeState is not Idle', () => {
        mockSelectorState.controller.state.status.activeState = 'Run';
        render(<Coolant mistActive={false} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).toBeDisabled();
        expect(screen.getByLabelText('Flood')).toBeDisabled();
        expect(screen.getByLabelText('Off')).toBeDisabled();
    });

    it('handles missing controllerState gracefully (defaults applied)', () => {
        mockSelectorState.controller.state = undefined;
        render(<Coolant mistActive={false} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).toBeDisabled();
    });

    it('calls startMist when Mist button is clicked', () => {
        render(<Coolant mistActive={false} floodActive={false} />);
        fireEvent.click(screen.getByLabelText('Mist'));
        expect(startMist).toHaveBeenCalled();
    });

    it('calls startFlood when Flood button is clicked', () => {
        render(<Coolant mistActive={false} floodActive={false} />);
        fireEvent.click(screen.getByLabelText('Flood'));
        expect(startFlood).toHaveBeenCalled();
    });

    it('calls stopCoolant when Off button is clicked', () => {
        render(<Coolant mistActive={false} floodActive={false} />);
        fireEvent.click(screen.getByLabelText('Off'));
        expect(stopCoolant).toHaveBeenCalled();
    });

    it('shows Mist as active when mistActive and isConnected are true', () => {
        render(<Coolant mistActive={true} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows Mist as inactive when isConnected is false, even if mistActive is true', () => {
        mockSelectorState.connection.isConnected = false;
        render(<Coolant mistActive={true} floodActive={false} />);
        expect(screen.getByLabelText('Mist')).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows Flood as active when floodActive and isConnected are true', () => {
        render(<Coolant mistActive={false} floodActive={true} />);
        expect(screen.getByLabelText('Flood')).toHaveAttribute('aria-pressed', 'true');
    });

    it('Off button never shows as active', () => {
        render(<Coolant mistActive={true} floodActive={true} />);
        expect(screen.getByLabelText('Off')).toHaveAttribute('aria-pressed', 'false');
    });
});

describe('Coolant — mapStateToProps (default export logic)', () => {
    it('derives mistActive: true, floodActive: false when modal is M7', () => {
        const result = capturedMapStateToProps!({
            controller: { modal: { coolant: 'M7' } },
        });
        expect(result.mistActive).toBe(true);
        expect(result.floodActive).toBe(false);
    });

    it('derives mistActive: false, floodActive: true when modal is M8', () => {
        const result = capturedMapStateToProps!({
            controller: { modal: { coolant: 'M8' } },
        });
        expect(result.mistActive).toBe(false);
        expect(result.floodActive).toBe(true);
    });

    it('derives both false when modal is M9 (off)', () => {
        const result = capturedMapStateToProps!({
            controller: { modal: { coolant: 'M9' } },
        });
        expect(result.mistActive).toBe(false);
        expect(result.floodActive).toBe(false);
    });

    it('derives both true when modal contains M7 and M8 together (array)', () => {
        const result = capturedMapStateToProps!({
            controller: { modal: { coolant: ['M7', 'M8'] } },
        });
        expect(result.mistActive).toBe(true);
        expect(result.floodActive).toBe(true);
    });

    it('defaults to M9 (both false) when coolant modal is missing entirely', () => {
        const result = capturedMapStateToProps!({
            controller: {},
        });
        expect(result.mistActive).toBe(false);
        expect(result.floodActive).toBe(false);
    });
});