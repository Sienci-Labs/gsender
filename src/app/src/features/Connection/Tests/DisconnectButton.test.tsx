import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisconnectButton } from '../components/DisconnectButton';

describe('DisconnectButton', () => {
    it('renders the Disconnect label', () => {
        render(<DisconnectButton disconnectHandler={jest.fn()} />);
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('calls disconnectHandler on click', () => {
        const disconnectHandler = jest.fn();
        render(<DisconnectButton disconnectHandler={disconnectHandler} />);
        fireEvent.click(screen.getByRole('button'));
        expect(disconnectHandler).toHaveBeenCalledTimes(1);
    });

    it('calls disconnectHandler when Enter is pressed', () => {
        const disconnectHandler = jest.fn();
        render(<DisconnectButton disconnectHandler={disconnectHandler} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        expect(disconnectHandler).toHaveBeenCalledTimes(1);
    });

    it('calls disconnectHandler when Space is pressed', () => {
        const disconnectHandler = jest.fn();
        render(<DisconnectButton disconnectHandler={disconnectHandler} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
        expect(disconnectHandler).toHaveBeenCalledTimes(1);
    });

    it('does not call disconnectHandler on unrelated key press', () => {
        const disconnectHandler = jest.fn();
        render(<DisconnectButton disconnectHandler={disconnectHandler} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
        expect(disconnectHandler).not.toHaveBeenCalled();
    });

    it('is keyboard accessible (tabIndex 0)', () => {
        render(<DisconnectButton disconnectHandler={jest.fn()} />);
        expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0');
    });
});