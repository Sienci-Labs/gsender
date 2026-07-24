import React from 'react';
import { render } from '@testing-library/react';
import { ConnectionStateIndicator } from '../components/ConnectionStateIndicator';

jest.mock('../index', () => ({
    ConnectionType: {
        DISCONNECTED: 'DISCONNECTED',
        ETHERNET: 'ETHERNET',
        USB: 'USB',
        REMOTE: 'REMOTE',
    },
    ConnectionState: {
        DISCONNECTED: 0,
        CONNECTED: 1,
        CONNECTING: 2,
        ERROR: 3,
    },
}));

const { ConnectionType, ConnectionState } = require('../index');

describe('ConnectionStateIndicator', () => {
    it('renders the disconnected icon and pulses when disconnected', () => {
        const { container } = render(
            <ConnectionStateIndicator
                state={ConnectionState.DISCONNECTED}
                type={ConnectionType.DISCONNECTED}
            />,
        );
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
        expect(container.querySelector('.text-blue-700')).toBeInTheDocument();
    });

    // NOTE: icon markup (<svg>) is stripped by the global react-icons mock in
    // jest.config.js (moduleNameMapper), which returns null for every icon.
    // See bug report: "jest.config.js globally mocks react-icons". These tests
    // verify the wrapper renders correctly instead of checking for the icon itself.
    it('renders without crashing when type is USB', () => {
        const { container } = render(
            <ConnectionStateIndicator
                state={ConnectionState.CONNECTED}
                type={ConnectionType.USB}
            />,
        );
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders without crashing when type is ETHERNET', () => {
        const { container } = render(
            <ConnectionStateIndicator
                state={ConnectionState.CONNECTED}
                type={ConnectionType.ETHERNET}
            />,
        );
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders without crashing when type is REMOTE', () => {
        const { container } = render(
            <ConnectionStateIndicator
                state={ConnectionState.CONNECTED}
                type={ConnectionType.REMOTE}
            />,
        );
        expect(container.firstChild).toBeInTheDocument();
    });

    it('shows the green check badge wrapper when connected', () => {
        const { container } = render(
            <ConnectionStateIndicator
                state={ConnectionState.CONNECTED}
                type={ConnectionType.USB}
            />,
        );
        expect(container.querySelector('.absolute.top-\\[-2px\\]')).toBeInTheDocument();
    });

    it('does not show the check badge wrapper when not connected', () => {
        const { container } = render(
            <ConnectionStateIndicator
                state={ConnectionState.CONNECTING}
                type={ConnectionType.USB}
            />,
        );
        expect(container.querySelector('.absolute.top-\\[-2px\\]')).not.toBeInTheDocument();
    });

    it('applies yellow colour when connecting', () => {
        const { container } = render(
            <ConnectionStateIndicator
                state={ConnectionState.CONNECTING}
                type={ConnectionType.USB}
            />,
        );
        expect(container.querySelector('.text-yellow-600')).toBeInTheDocument();
    });

    it('applies red colour on error', () => {
        const { container } = render(
            <ConnectionStateIndicator
                state={ConnectionState.ERROR}
                type={ConnectionType.USB}
            />,
        );
        expect(container.querySelector('.text-red-600')).toBeInTheDocument();
    });

    it('does not pulse once connected', () => {
        const { container } = render(
            <ConnectionStateIndicator
                state={ConnectionState.CONNECTED}
                type={ConnectionType.USB}
            />,
        );
        expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
});