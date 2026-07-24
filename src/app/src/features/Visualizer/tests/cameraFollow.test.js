/**
 * Unit tests for the camera "follow tool" feature added to Visualizer.jsx.
 *
 * Tests the three pure-logic helpers and the rAF lifecycle without mounting
 * the full Visualizer (which requires Three.js, WebGL, and heavy mocks).
 * We extract the methods onto a minimal stub that mirrors just the instance
 * shape the methods read/write.
 */

// Pull in the methods under test directly from the source so we don't need
// to instantiate the full React component.
import {
    isFollowEnabled,
    getToolScenePosition,
    startCameraFollow,
    stopCameraFollow,
} from '../cameraFollowHelpers';

// ---------------------------------------------------------------------------
// isFollowEnabled
// ---------------------------------------------------------------------------
describe('isFollowEnabled', () => {
    it('returns false when props are empty', () => {
        expect(isFollowEnabled({ props: {} })).toBe(false);
    });

    it('returns true when followTool prop is true', () => {
        expect(isFollowEnabled({ props: { followTool: true } })).toBe(true);
    });

    it('returns false when followTool prop is false', () => {
        expect(isFollowEnabled({ props: { followTool: false } })).toBe(false);
    });

    it('returns true when state.followTool is true', () => {
        expect(
            isFollowEnabled({ props: { state: { followTool: true } } }),
        ).toBe(true);
    });

    it('returns false when state.followTool is false and prop is absent', () => {
        expect(
            isFollowEnabled({ props: { state: { followTool: false } } }),
        ).toBe(false);
    });

    it('direct prop overrides state when both set', () => {
        // Either truthy value switches follow on
        expect(
            isFollowEnabled({
                props: { followTool: true, state: { followTool: false } },
            }),
        ).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// getToolScenePosition
// ---------------------------------------------------------------------------
describe('getToolScenePosition', () => {
    it('uses cuttingTool.position when the STL model is loaded', () => {
        const ctx = {
            cuttingTool: { position: { x: 10, y: 20, z: 30 } },
            pivotPoint: { get: () => ({ x: 0, y: 0, z: 0 }) },
            workPosition: { x: 5, y: 5, z: 5 },
        };
        expect(getToolScenePosition(ctx)).toEqual({ x: 10, y: 20, z: 30 });
    });

    it('falls back to workPosition - pivotPoint when cuttingTool is null', () => {
        const ctx = {
            cuttingTool: null,
            pivotPoint: { get: () => ({ x: 1, y: 2, z: 3 }) },
            workPosition: { x: 11, y: 12, z: 13 },
        };
        expect(getToolScenePosition(ctx)).toEqual({ x: 10, y: 10, z: 10 });
    });

    it('handles missing workPosition fields as zero', () => {
        const ctx = {
            cuttingTool: null,
            pivotPoint: { get: () => ({ x: 5, y: 5, z: 5 }) },
            workPosition: {},
        };
        expect(getToolScenePosition(ctx)).toEqual({ x: -5, y: -5, z: -5 });
    });

    it('handles null workPosition as all-zero', () => {
        const ctx = {
            cuttingTool: null,
            pivotPoint: { get: () => ({ x: 2, y: 3, z: 4 }) },
            workPosition: null,
        };
        expect(getToolScenePosition(ctx)).toEqual({ x: -2, y: -3, z: -4 });
    });
});

// ---------------------------------------------------------------------------
// startCameraFollow / stopCameraFollow (rAF lifecycle)
// ---------------------------------------------------------------------------
describe('startCameraFollow / stopCameraFollow', () => {
    let ctx;

    beforeEach(() => {
        // Minimal context that mirrors the Visualizer instance fields the
        // follow methods read and write.
        ctx = {
            cameraFollowRAF: null,
            props: { followTool: true },
            controls: {
                target: { x: 0, y: 0, z: 0 },
                update: jest.fn(),
            },
            camera: {
                position: { x: 0, y: 0, z: 0 },
            },
            cuttingTool: { position: { x: 5, y: 5, z: 5 } },
            pivotPoint: { get: () => ({ x: 0, y: 0, z: 0 }) },
            workPosition: { x: 5, y: 5, z: 5 },
            updateScene: jest.fn(),
        };

        // Replace rAF with a synchronous stub that records calls.
        jest
            .spyOn(global, 'requestAnimationFrame')
            .mockImplementation((cb) => {
                const id = Math.random();
                // Don't auto-invoke — tests control when a frame fires.
                return id;
            });
        jest
            .spyOn(global, 'cancelAnimationFrame')
            .mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('startCameraFollow schedules a rAF when follow is on and not already running', () => {
        startCameraFollow(ctx);
        expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
        expect(ctx.cameraFollowRAF).not.toBeNull();
    });

    it('startCameraFollow is a no-op when follow is disabled', () => {
        ctx.props = { followTool: false };
        startCameraFollow(ctx);
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(ctx.cameraFollowRAF).toBeNull();
    });

    it('startCameraFollow is a no-op when a loop is already running', () => {
        ctx.cameraFollowRAF = 42; // already running
        startCameraFollow(ctx);
        expect(requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('stopCameraFollow cancels the rAF and nulls the handle', () => {
        ctx.cameraFollowRAF = 99;
        stopCameraFollow(ctx);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(99);
        expect(ctx.cameraFollowRAF).toBeNull();
    });

    it('stopCameraFollow is a no-op when no loop is running', () => {
        ctx.cameraFollowRAF = null;
        stopCameraFollow(ctx);
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
    });

    it('the tick loop stops itself when follow is toggled off mid-frame', () => {
        // Use a manual rAF that lets us fire the callback on demand.
        let pendingCb = null;
        requestAnimationFrame.mockImplementation((cb) => {
            pendingCb = cb;
            return 7;
        });

        startCameraFollow(ctx);
        expect(pendingCb).not.toBeNull();

        // Disable follow before the first frame fires.
        ctx.props = { followTool: false };
        pendingCb(); // fire the tick

        // Loop should have stopped itself without scheduling another frame.
        expect(ctx.cameraFollowRAF).toBeNull();
        expect(requestAnimationFrame).toHaveBeenCalledTimes(1); // only the initial schedule
    });

    it('the tick loop stops itself once the camera has caught up (distance < SETTLE)', () => {
        let pendingCb = null;
        requestAnimationFrame.mockImplementation((cb) => {
            pendingCb = cb;
            return 8;
        });

        // Tool and orbit target at the same position → distance is 0.
        ctx.controls.target = { x: 5, y: 5, z: 5 };
        ctx.camera.position = { x: 0, y: 0, z: 0 };

        startCameraFollow(ctx);
        pendingCb();

        expect(ctx.cameraFollowRAF).toBeNull();
        expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    });
});
