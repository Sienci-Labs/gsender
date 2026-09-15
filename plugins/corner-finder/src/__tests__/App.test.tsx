import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';

// the SDK ships ESM-only dist output (no CJS build), so plugin unit tests
// mock it rather than depend on a built dist/
// vi.mock factories are hoisted above imports, so the mocks they close over
// must come from vi.hoisted rather than plain top-level consts.
const {
    setOverlay,
    cameraSet,
    lockRotate,
    screenToWorld,
    worldToScreen,
    armPick,
    disarmPick,
    setBusy,
    useVisualizerPickMock,
} = vi.hoisted(() => ({
    setOverlay: vi.fn().mockResolvedValue(undefined),
    cameraSet: vi.fn().mockResolvedValue(undefined),
    lockRotate: vi.fn().mockResolvedValue(undefined),
    screenToWorld: vi.fn().mockResolvedValue({ x: 1, y: 2, z: 0 }),
    worldToScreen: vi.fn().mockResolvedValue({ x: 100, y: 200 }),
    armPick: vi.fn(),
    disarmPick: vi.fn(),
    setBusy: vi.fn().mockResolvedValue(undefined),
    useVisualizerPickMock: vi.fn(
        (
            _mode: 'click' | 'hold',
            _handler: (event: unknown) => void,
            opts?: { enabled?: boolean },
        ) => ({ armed: opts?.enabled !== false, error: null as string | null }),
    ),
}));

vi.mock('@sienci/gsender-plugin-sdk', () => ({
    viewer: {
        setOverlay,
        camera: { set: cameraSet, lockRotate },
        screenToWorld,
        worldToScreen,
        armPick,
        disarmPick,
    },
    machine: { setBusy },
}));

vi.mock('@sienci/gsender-plugin-sdk/react', () => ({
    useVisualizerPick: (
        mode: 'click' | 'hold',
        handler: (event: unknown) => void,
        opts?: { enabled?: boolean },
    ) => useVisualizerPickMock(mode, handler, opts),
}));

const pick = (
    world: { x: number; y: number; z: number },
    screen = { x: 0, y: 0 },
) => ({
    kind: 'pick' as const,
    world,
    screen,
});

const lastContinuousPickHandler = () => {
    const call = useVisualizerPickMock.mock.calls.at(-1);
    if (!call) {
        throw new Error('useVisualizerPick was never called');
    }
    return call[1] as (event: unknown) => void;
};

describe('Corner Finder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setOverlay.mockResolvedValue(undefined);
        screenToWorld.mockResolvedValue({ x: 1, y: 2, z: 0 });
        worldToScreen.mockResolvedValue({ x: 100, y: 200 });
        setBusy.mockResolvedValue(undefined);
    });

    it('accumulates a marker per pick and redraws the host overlay', () => {
        render(<App />);

        act(() => {
            lastContinuousPickHandler()(pick({ x: 1, y: 2, z: 0 }));
        });

        expect(screen.getByText('Corners: 1')).toBeInTheDocument();
        expect(setOverlay).toHaveBeenLastCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ x: 1, y: 2, z: 0 }),
            ]),
        );
    });

    it('shows the distance between the last two picks only once there are 2+', () => {
        render(<App />);

        act(() => {
            lastContinuousPickHandler()(pick({ x: 0, y: 0, z: 0 }));
        });
        expect(screen.queryByText(/distance between/i)).not.toBeInTheDocument();

        act(() => {
            lastContinuousPickHandler()(pick({ x: 3, y: 4, z: 0 }));
        });
        expect(screen.getByText(/distance between/i)).toHaveTextContent('5.00');
    });

    it('clears markers locally and on the host overlay', () => {
        render(<App />);

        act(() => {
            lastContinuousPickHandler()(pick({ x: 1, y: 1, z: 0 }));
        });
        expect(screen.getByText('Corners: 1')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /clear markers/i }));

        expect(screen.getByText('Corners: 0')).toBeInTheDocument();
        expect(setOverlay).toHaveBeenLastCalledWith([]);
    });

    it.each([
        ['Top', 'top'],
        ['3D', '3d'],
        ['Front', 'front'],
        ['Left', 'left'],
        ['Right', 'right'],
    ])(
        "calls camera.set('%s') for the %s preset button",
        async (label, view) => {
            render(<App />);

            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: label }));
            });

            expect(cameraSet).toHaveBeenCalledWith(view);
        },
    );

    it('locks camera rotation via the checkbox', async () => {
        render(<App />);

        await act(async () => {
            fireEvent.click(screen.getByLabelText(/lock rotation/i));
        });

        expect(lockRotate).toHaveBeenCalledWith(true);
    });

    it('disarms continuous picking during quick-locate, then re-enables it once it resolves', async () => {
        let capturedCallback: ((event: unknown) => void) | undefined;
        armPick.mockImplementation(
            async (_mode: string, cb: (e: unknown) => void) => {
                capturedCallback = cb;
                return vi.fn();
            },
        );

        render(<App />);
        expect(useVisualizerPickMock).toHaveBeenLastCalledWith(
            'click',
            expect.any(Function),
            expect.objectContaining({ enabled: true }),
        );

        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: /quick locate/i }),
            );
        });

        expect(useVisualizerPickMock).toHaveBeenLastCalledWith(
            'click',
            expect.any(Function),
            expect.objectContaining({ enabled: false }),
        );

        await act(async () => {
            capturedCallback?.(pick({ x: 9, y: 9, z: 0 }));
        });

        expect(cameraSet).toHaveBeenCalledWith('top');
        expect(useVisualizerPickMock).toHaveBeenLastCalledWith(
            'click',
            expect.any(Function),
            expect.objectContaining({ enabled: true }),
        );
    });

    it('flags the machine busy for the simulated operation and releases it even if the work throws', async () => {
        render(<App />);

        // Give it a corner so simulateOperation's worldToScreen step actually runs.
        act(() => {
            lastContinuousPickHandler()(pick({ x: 5, y: 5, z: 0 }));
        });
        worldToScreen.mockRejectedValueOnce(new Error('boom'));

        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: /simulate operation/i }),
            );
        });

        expect(setBusy).toHaveBeenNthCalledWith(1, true, expect.any(String));
        expect(setBusy).toHaveBeenLastCalledWith(false);
        expect(screen.getByText('boom')).toBeInTheDocument();
    });
});
