import { act, renderHook } from '@testing-library/react';
import { useHoldToActivate } from '../useHoldToActivate';

const press = { pointerType: 'touch', button: 0 } as React.PointerEvent;

describe('useHoldToActivate', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    it('fires once the full duration is held', () => {
        const onActivate = jest.fn();
        const { result } = renderHook(() =>
            useHoldToActivate(onActivate, { durationMs: 1000 }),
        );

        act(() => result.current.bind.onPointerDown(press));
        act(() => {
            jest.advanceTimersByTime(500);
        });
        expect(result.current.holding).toBe(true);
        expect(result.current.progress).toBeGreaterThan(0.3);
        expect(result.current.progress).toBeLessThan(0.7);
        expect(onActivate).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(600);
        });
        expect(onActivate).toHaveBeenCalledTimes(1);
        expect(result.current.holding).toBe(false);
        expect(result.current.progress).toBe(0);
    });

    it('does nothing when released early', () => {
        const onActivate = jest.fn();
        const { result } = renderHook(() =>
            useHoldToActivate(onActivate, { durationMs: 1000 }),
        );

        act(() => result.current.bind.onPointerDown(press));
        act(() => {
            jest.advanceTimersByTime(900);
        });
        act(() => result.current.bind.onPointerUp());
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(onActivate).not.toHaveBeenCalled();
        expect(result.current.progress).toBe(0);
    });

    it('cancels when the pointer leaves or the browser cancels it', () => {
        const onActivate = jest.fn();
        const { result } = renderHook(() =>
            useHoldToActivate(onActivate, { durationMs: 1000 }),
        );

        act(() => result.current.bind.onPointerDown(press));
        act(() => result.current.bind.onPointerLeave());
        act(() => result.current.bind.onPointerDown(press));
        act(() => result.current.bind.onPointerCancel());
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(onActivate).not.toHaveBeenCalled();
    });

    it('ignores presses while disabled and secondary mouse buttons', () => {
        const onActivate = jest.fn();
        const { result, rerender } = renderHook(
            ({ disabled }) =>
                useHoldToActivate(onActivate, { durationMs: 1000, disabled }),
            { initialProps: { disabled: true } },
        );

        act(() => result.current.bind.onPointerDown(press));
        act(() => {
            jest.advanceTimersByTime(1500);
        });
        expect(result.current.holding).toBe(false);

        rerender({ disabled: false });
        act(() =>
            result.current.bind.onPointerDown({
                pointerType: 'mouse',
                button: 2,
            } as React.PointerEvent),
        );
        act(() => {
            jest.advanceTimersByTime(1500);
        });
        expect(onActivate).not.toHaveBeenCalled();
    });
});
