import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PortListings, PortListingButton } from '../components/PortListings';

jest.mock('app/store', () => ({
    get: jest.fn((key: string, fallback: any) => {
        if (key === 'widgets.connection.ip') return [192, 168, 1, 100];
        if (key === 'widgets.connection.ethernetPort') return 23;
        if (key === 'widgets.connection.baudrate') return 115200;
        return fallback;
    }),
    on: jest.fn(),
}));

jest.mock('../index', () => ({
    ConnectionType: {
        DISCONNECTED: 'DISCONNECTED',
        ETHERNET: 'ETHERNET',
        USB: 'USB',
        REMOTE: 'REMOTE',
    },
}));

const { ConnectionType } = require('../index');

const mockUsbPort = { port: '/dev/tty.usbmodem14201', manufacturer: 'Sienci' };
const mockUnrecognizedPort = { port: '/dev/tty.wchusbserial123', manufacturer: 'Unknown' };

afterEach(() => {
    jest.clearAllMocks();
});

describe('PortListingButton', () => {
    it('renders truncated port name', () => {
        render(
            <PortListingButton
                port={mockUsbPort}
                connectionHandler={jest.fn()}
                baud={115200}
            />,
        );
        expect(screen.getByText('usbmodem14201'.slice(-10))).toBeInTheDocument();
    });

    it('renders the baud rate', () => {
        render(
            <PortListingButton
                port={mockUsbPort}
                connectionHandler={jest.fn()}
                baud={115200}
            />,
        );
        expect(screen.getByText('USB (115200)')).toBeInTheDocument();
    });

    it('calls connectionHandler with port and USB type on click', () => {
        const connectionHandler = jest.fn();
        render(
            <PortListingButton
                port={mockUsbPort}
                connectionHandler={connectionHandler}
                baud={115200}
            />,
        );
        fireEvent.click(screen.getByRole('button'));
        expect(connectionHandler).toHaveBeenCalledWith(
            mockUsbPort.port,
            ConnectionType.USB,
        );
    });
});

describe('PortListings — rendering', () => {
    it('shows "No USB devices found" when ports list is empty', () => {
        render(
            <PortListings
                ports={[]}
                unrecognizedPorts={[]}
                connectHandler={jest.fn()}
            />,
        );
        expect(screen.getByText('No USB devices found')).toBeInTheDocument();
    });

    it('does not show "No USB devices found" when ports exist', () => {
        render(
            <PortListings
                ports={[mockUsbPort]}
                unrecognizedPorts={[]}
                connectHandler={jest.fn()}
            />,
        );
        expect(screen.queryByText('No USB devices found')).not.toBeInTheDocument();
    });

    it('renders a PortListingButton for each recognized port', () => {
        render(
            <PortListings
                ports={[mockUsbPort]}
                unrecognizedPorts={[]}
                connectHandler={jest.fn()}
            />,
        );
        expect(screen.getByText('USB (115200)')).toBeInTheDocument();
    });

    it('renders the Ethernet option with stored IP and port', () => {
        render(
            <PortListings
                ports={[]}
                unrecognizedPorts={[]}
                connectHandler={jest.fn()}
            />,
        );
        expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
        expect(screen.getByText('Ethernet (port 23)')).toBeInTheDocument();
    });

    it('does not render "Unrecognized Ports" section when there are none', () => {
        render(
            <PortListings
                ports={[]}
                unrecognizedPorts={[]}
                connectHandler={jest.fn()}
            />,
        );
        expect(screen.queryByText('Unrecognized Ports')).not.toBeInTheDocument();
    });

    it('renders "Unrecognized Ports" toggle when unrecognized ports exist', () => {
        render(
            <PortListings
                ports={[]}
                unrecognizedPorts={[mockUnrecognizedPort]}
                connectHandler={jest.fn()}
            />,
        );
        expect(screen.getByText('Unrecognized Ports')).toBeInTheDocument();
    });
});

describe('PortListings — interactions', () => {
    it('calls connectHandler with ETHERNET type when Ethernet button is clicked', () => {
        const connectHandler = jest.fn();
        render(
            <PortListings
                ports={[]}
                unrecognizedPorts={[]}
                connectHandler={connectHandler}
            />,
        );
        fireEvent.click(screen.getByText('Ethernet (port 23)').closest('button')!);
        expect(connectHandler).toHaveBeenCalledWith('192.168.1.100', ConnectionType.ETHERNET);
    });

    it('toggles unrecognized ports section open when header is clicked', () => {
        const { container } = render(
            <PortListings
                ports={[]}
                unrecognizedPorts={[mockUnrecognizedPort]}
                connectHandler={jest.fn()}
            />,
        );
        const toggle = screen.getByText('Unrecognized Ports');
        fireEvent.click(toggle);
        const expandedSection = container.querySelector('.scale-y-100');
        expect(expandedSection).toBeInTheDocument();
    });

    it('collapses unrecognized ports section when toggled twice', () => {
        const { container } = render(
            <PortListings
                ports={[]}
                unrecognizedPorts={[mockUnrecognizedPort]}
                connectHandler={jest.fn()}
            />,
        );
        const toggle = screen.getByText('Unrecognized Ports');
        fireEvent.click(toggle);
        fireEvent.click(toggle);
        const collapsedSection = container.querySelector('.scale-y-0');
        expect(collapsedSection).toBeInTheDocument();
    });

    it('calls connectHandler when an unrecognized port is clicked', () => {
        const connectHandler = jest.fn();
        render(
            <PortListings
                ports={[]}
                unrecognizedPorts={[mockUnrecognizedPort]}
                connectHandler={connectHandler}
            />,
        );
        fireEvent.click(screen.getByText('Unrecognized Ports'));
        fireEvent.click(screen.getByText('USB (115200)'));
        expect(connectHandler).toHaveBeenCalledWith(
            mockUnrecognizedPort.port,
            ConnectionType.USB,
        );
    });
});

describe('PortListings — store change events', () => {
    it('updates IP, baud, and port when store "change" event fires', () => {
        const store = require('app/store');
        let changeCallback: () => void;

        (store.on as jest.Mock).mockImplementation((event: string, cb: () => void) => {
            if (event === 'change') changeCallback = cb;
        });

        (store.get as jest.Mock).mockImplementation((key: string, fallback: any) => {
            if (key === 'widgets.connection.ip') return [10, 0, 0, 5];
            if (key === 'widgets.connection.ethernetPort') return 8023;
            if (key === 'widgets.connection.baudrate') return 250000;
            return fallback;
        });

        render(
            <PortListings
                ports={[]}
                unrecognizedPorts={[]}
                connectHandler={jest.fn()}
            />,
        );

        act(() => {
            changeCallback();
        });

        expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
        expect(screen.getByText('Ethernet (port 8023)')).toBeInTheDocument();
    });
});