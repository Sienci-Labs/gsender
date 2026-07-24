import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FirmwareSelector } from '../components/FirmwareSelector';

describe('FirmwareSelector', () => {
    it('renders both Grbl and grblHAL buttons', () => {
        render(<FirmwareSelector onClick={jest.fn()} selectedFirmware="Grbl" />);
        expect(screen.getByText('Grbl')).toBeInTheDocument();
        expect(screen.getByText('grblHal')).toBeInTheDocument();
    });

    it('highlights Grbl as active when selectedFirmware is Grbl', () => {
        render(<FirmwareSelector onClick={jest.fn()} selectedFirmware="Grbl" />);
        expect(screen.getByText('Grbl').className).toContain('bg-blue-400');
        expect(screen.getByText('grblHal').className).not.toContain('bg-blue-400');
    });

    it('highlights grblHAL as active when selectedFirmware is grblHAL', () => {
        render(<FirmwareSelector onClick={jest.fn()} selectedFirmware="grblHAL" />);
        expect(screen.getByText('grblHal').className).toContain('bg-blue-400');
        expect(screen.getByText('Grbl').className).not.toContain('bg-blue-400');
    });

    it('calls onClick with "Grbl" when Grbl button is clicked', () => {
        const onClick = jest.fn();
        render(<FirmwareSelector onClick={onClick} selectedFirmware="grblHAL" />);
        fireEvent.click(screen.getByText('Grbl'));
        expect(onClick).toHaveBeenCalledWith('Grbl');
    });

    it('calls onClick with "grblHAL" when grblHAL button is clicked', () => {
        const onClick = jest.fn();
        render(<FirmwareSelector onClick={onClick} selectedFirmware="Grbl" />);
        fireEvent.click(screen.getByText('grblHal'));
        expect(onClick).toHaveBeenCalledWith('grblHAL');
    });

    it('neither button is active when selectedFirmware is empty', () => {
        render(<FirmwareSelector onClick={jest.fn()} selectedFirmware="" />);
        expect(screen.getByText('Grbl').className).not.toContain('bg-blue-400');
        expect(screen.getByText('grblHal').className).not.toContain('bg-blue-400');
    });
});