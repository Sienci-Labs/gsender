import { fireEvent, render, screen } from '@testing-library/react';
import { TabletConnect } from '../TabletConnect';

jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn() } }));

jest.mock('app/lib/toaster', () => ({
    toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('app/api', () => ({
    __esModule: true,
    default: { pendantPairing: { claim: jest.fn(), listTablets: jest.fn() } },
}));

jest.mock('../PairWithQr', () => ({
    __esModule: true,
    default: () => <div>QR pairing</div>,
}));

let mockTablets: unknown[] = [];
jest.mock('../usePendantTablets', () => ({
    usePendantTablets: () => ({
        desktopId: 'desk-1',
        browsing: true,
        tablets: mockTablets,
        refresh: jest.fn(),
        forget: jest.fn(),
    }),
}));

let mockState: any;
jest.mock('app/hooks/useTypedSelector', () => ({
    useTypedSelector: (selector: (state: unknown) => unknown) =>
        selector(mockState),
}));

const pairedTablet = {
    id: 'tab-1',
    name: 'Shop Tablet',
    host: '192.168.1.42',
    port: 8010,
    key: 'secret',
    paired: true,
    online: true,
};

const setState = ({
    fileLoaded = false,
    running = false,
}: {
    fileLoaded?: boolean;
    running?: boolean;
} = {}) => {
    mockState = {
        file: {
            fileLoaded,
            name: fileLoaded ? 'job.nc' : null,
            content: fileLoaded ? 'G0 X0\n' : '',
        },
        controller: { workflow: { state: running ? 'running' : 'idle' } },
    };
};

const sendButton = () =>
    screen.getByRole('button', { name: /^Send( \d+ files)?$/ });

describe('TabletConnect', () => {
    beforeEach(() => {
        localStorage.clear();
        mockTablets = [];
        setState();
    });

    it('explains pairing when no tablet is paired', () => {
        render(<TabletConnect />);
        expect(screen.getByText(/Remote File Receive/)).toBeInTheDocument();
        expect(screen.getByText('Pair with QR code')).toBeInTheDocument();
        expect(
            screen.getByText('Pair a tablet to send files to it.'),
        ).toBeInTheDocument();
        expect(sendButton()).toBeDisabled();
    });

    it('opens QR and code pairing inside the page', () => {
        render(<TabletConnect />);
        fireEvent.click(screen.getByText('Pair with QR code'));
        expect(screen.getByText('QR pairing')).toBeInTheDocument();
    });

    it('offers the loaded job and adds it to the send list', () => {
        mockTablets = [pairedTablet];
        setState({ fileLoaded: true });
        render(<TabletConnect />);

        expect(sendButton()).toBeDisabled();
        fireEvent.click(screen.getByText('Send loaded file'));

        expect(screen.getByText('Loaded file added')).toBeInTheDocument();
        expect(screen.getByLabelText('Remove job.nc')).toBeInTheDocument();
        expect(sendButton()).toBeEnabled();
    });

    it('hides the loaded-file option when nothing is loaded', () => {
        mockTablets = [pairedTablet];
        render(<TabletConnect />);
        expect(screen.queryByText('Send loaded file')).not.toBeInTheDocument();
    });

    it('blocks sending while a job is running', () => {
        mockTablets = [pairedTablet];
        setState({ fileLoaded: true, running: true });
        render(<TabletConnect />);
        fireEvent.click(screen.getByText('Send loaded file'));
        expect(sendButton()).toBeDisabled();
        expect(
            screen.getByText('Sending is paused while a job is running.'),
        ).toBeInTheDocument();
    });
});
