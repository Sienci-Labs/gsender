import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConnectionInfo } from '../components/ConnectionInfo';

describe('ConnectionInfo', () => {
    it('renders the firmware type', () => {
        render(<ConnectionInfo port="/dev/tty.usbmodem14201" firmwareType="Grbl" />);
        expect(screen.getByText('Grbl')).toBeInTheDocument();
    });

    it('strips the /dev/tty.usbmodem prefix from the port', () => {
        render(<ConnectionInfo port="/dev/tty.usbmodem14201" firmwareType="Grbl" />);
        expect(screen.getByText('14201')).toBeInTheDocument();
    });

    it('renders grblHAL firmware type', () => {
        render(<ConnectionInfo port="/dev/tty.usbmodem14201" firmwareType="grblHAL" />);
        expect(screen.getByText('grblHAL')).toBeInTheDocument();
    });

    it('renders full port string unchanged if prefix is not present (e.g. Windows COM ports)', () => {
        render(<ConnectionInfo port="COM3" firmwareType="Grbl" />);
        expect(screen.getByText('COM3')).toBeInTheDocument();
    });

    it('renders an empty firmware type without crashing', () => {
        render(<ConnectionInfo port="COM3" firmwareType="" />);
        expect(screen.getByText('COM3')).toBeInTheDocument();
    });
});