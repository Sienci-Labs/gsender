import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useSendToTablet } from '../useSendToTablet';

jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn() } }));

jest.mock('app/lib/toaster', () => ({
    toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('app/api', () => ({
    __esModule: true,
    default: { pendantPairing: { claim: jest.fn(), listTablets: jest.fn() } },
}));

const mockForget = jest.fn();
const mockTablets = [
    {
        id: 'tab-1',
        name: 'Shop Tablet',
        host: '192.168.1.42',
        port: 8010,
        key: 'secret',
        paired: true,
        online: true,
    },
    { id: 'tab-2', name: 'Unpaired', paired: false, online: true },
];

jest.mock('../usePendantTablets', () => ({
    usePendantTablets: () => ({
        desktopId: 'desk-1',
        browsing: true,
        tablets: mockTablets,
        refresh: jest.fn(),
        forget: mockForget,
    }),
}));

const post = axios.post as jest.Mock;

const gcode = (name: string, body = 'G0 X0\n') =>
    new File([body], name, { type: 'text/plain' });

describe('useSendToTablet', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        post.mockReset();
        mockForget.mockReset();
        localStorage.clear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('selects a paired tablet and ignores unpaired discoveries', () => {
        const { result } = renderHook(() => useSendToTablet());
        expect(result.current.pairedTablets.map((t) => t.id)).toEqual([
            'tab-1',
        ]);
        expect(result.current.selected?.id).toBe('tab-1');
    });

    it('turns the loaded job into a file with its name and content', async () => {
        const { result } = renderHook(() => useSendToTablet());
        act(() => result.current.addContent('part.nc', 'G1 X10\n'));

        expect(result.current.files).toHaveLength(1);
        const [file] = result.current.files;
        expect(file.name).toBe('part.nc');
        // jsdom's File has no .text(), so read it the browser way.
        const text = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(file);
        });
        expect(text).toBe('G1 X10\n');
    });

    it('rejects unsupported file types and de-duplicates', () => {
        const { result } = renderHook(() => useSendToTablet());
        act(() =>
            result.current.handleFileSelect([
                gcode('a.nc'),
                gcode('a.nc'),
                gcode('notes.txt'),
            ] as unknown as FileList),
        );
        expect(result.current.files.map((f) => f.name)).toEqual(['a.nc']);
    });

    it('forces library mode for multiple files', () => {
        const { result } = renderHook(() => useSendToTablet());
        act(() => result.current.addContent('a.nc', 'G0'));
        expect(result.current.willLoadActive).toBe(true);
        act(() => result.current.addContent('b.nc', 'G0'));
        expect(result.current.multipleFiles).toBe(true);
        expect(result.current.willLoadActive).toBe(false);
    });

    it('uploads files one at a time with the pairing headers', async () => {
        post.mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useSendToTablet());
        act(() => {
            result.current.addContent('a.nc', 'G0');
            result.current.addContent('b c.nc', 'G1');
        });

        await act(async () => {
            await result.current.handleSend();
        });

        expect(post).toHaveBeenCalledTimes(2);
        const [url, form, config] = post.mock.calls[1];
        expect(url).toBe('http://192.168.1.42:8010/pendant/file');
        expect((form as FormData).get('mode')).toBe('library');
        expect(config.headers).toEqual({
            Authorization: 'Bearer secret',
            'X-Pendant-Desktop-Id': 'desk-1',
            'X-Pendant-Filename': encodeURIComponent('b c.nc'),
        });
        expect(result.current.sendComplete).toBe(true);
        expect(localStorage.getItem('sendToPendant.lastTabletId')).toBe(
            'tab-1',
        );

        // The form clears for the next send.
        act(() => jest.runAllTimers());
        await waitFor(() => expect(result.current.files).toHaveLength(0));
    });

    it('forgets the tablet and goes back to pairing on a 401', async () => {
        post.mockRejectedValue({ response: { status: 401 } });
        const { result } = renderHook(() => useSendToTablet());
        act(() => result.current.addContent('a.nc', 'G0'));

        await act(async () => {
            await result.current.handleSend();
        });

        expect(mockForget).toHaveBeenCalledWith('tab-1');
        expect(result.current.view).toBe('qr');
        expect(result.current.sending).toBe(false);
    });
});
