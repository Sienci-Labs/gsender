import type { GCodeViewerHandle, GCodeViewerOptions } from '@sienci/gviewer/viewer';
import { GCodeVisualizer } from '@sienci/gviewer/react';
import { GRBL_ACTIVE_STATE_IDLE, METRIC_UNITS } from 'app/constants';
import { getSafeXYMoveCode } from 'app/features/DRO/utils/SafeMove';
import { buildMachineBedOptions } from 'app/features/Visualizer/viewerOptions';
import {
    buildViewerTheme,
    currentViewerThemeName,
    WORKSHOP_VISUALIZER_COLORS,
} from 'app/features/Visualizer/viewerTheme';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import type { RootState } from 'app/store/redux';
import _get from 'lodash/get';
import pubsub from 'pubsub-js';
import {
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    type ForwardedRef,
} from 'react';

export interface VisualizerHandle {
    focusToModel: () => void;
    focusToMachineBed: () => void;
    /** Pans the camera to center on the bit's last known position, preserving
     * the current zoom/angle — for when there's no toolpath to frame. */
    focusToBit: () => void;
    /** Arms tap-to-jog: the next tap on the canvas sends a safe XY move there. */
    armJog: () => void;
    disarmJog: () => void;
}

interface VisualizerProps {
    /** Fires whenever tap-to-jog is armed/disarmed, so an overlay button can
     * reflect the pressed state. */
    onJogArmedChange?: (armed: boolean) => void;
}

const MACHINE_NOT_READY_MESSAGE = 'Machine must be connected and idle to move';

// Pendant mode: gviewer's WebGL renderer locked top-down (orthographic, no
// view cube, no grid), fed the worker's Z-deduped 2D segment groups. The
// crosshair and origin dot are sized in screen pixels.
export const BASE_OPTIONS: Partial<GCodeViewerOptions> = {
    viewMode: 'pendant',
    units: 'mm',
    bit: {
        enabled: true,
        type: 'crosshair',
        size: 26,
        opacity: 1,
        tweenMs: 260,
        colorSource: 'custom',
        color: WORKSHOP_VISUALIZER_COLORS.bit,
        spinRpm: 300,
        screenSpace: true,
    },
    originMarker: { visible: true, color: '#ffffff', sizePx: 9 },
    boundingBox: { visible: false, labels: false },
    camera: {
        projection: 'orthographic',
        fov: 45,
        focusDurationMs: 0,
        orbit: { enableDamping: false },
        initialPosition: { x: 0, y: 0, z: 400 },
        lockTopDown: true,
    },
};

// Everything the bed rectangle depends on. All low-frequency, so options are
// rebuilt only when this key changes, not on every status report.
export const selectMachineBedKey = (s: RootState): string => {
    const settings = s.controller.settings?.settings ?? {};
    const keys = ['$22', '$23', '$130', '$131', '$683', '$684', '$685', '$686', '$687'];
    const wco = s.controller.wco ?? { x: 0, y: 0 };
    return [
        ...keys.map((k) => _get(settings, k)),
        !!s.controller.hasHomed,
        wco.x,
        wco.y,
    ].join(',');
};

// A primitive key, so identical idle status reports don't re-render.
const selectWposKey = (s: RootState): string => {
    const { x, y, z } = s.controller.wpos ?? { x: 0, y: 0, z: 0 };
    return `${Number(x) || 0},${Number(y) || 0},${Number(z) || 0}`;
};

function VisualizerImpl(
    { onJogArmedChange }: VisualizerProps,
    ref: ForwardedRef<VisualizerHandle>,
) {
    const viewerRef = useRef<GCodeViewerHandle>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // A file loaded while the Carve tab is hidden has nothing to fit against;
    // frame it once the container gets a size.
    const pendingFocusRef = useRef(false);

    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const isConnected = useTypedSelector(
        (s: RootState) => s.connection.isConnected,
    );
    const activeState = useTypedSelector((s: RootState) =>
        _get(s, 'controller.state.status.activeState'),
    );
    const { units } = useWorkspaceState();
    const machineBedKey = useTypedSelector(selectMachineBedKey);
    const wposKey = useTypedSelector(selectWposKey);

    // Mirrored into refs so the pointer-event handler (attached only while
    // armed) always sees the latest values without needing to be re-attached.
    const isConnectedRef = useRef(isConnected);
    isConnectedRef.current = isConnected;
    const activeStateRef = useRef(activeState);
    activeStateRef.current = activeState;
    const unitsRef = useRef(units);
    unitsRef.current = units;

    const jogArmedRef = useRef(false);
    const jogHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);
    const lastPositionRef = useRef({ x: 0, y: 0, z: 0 });

    const options = useMemo<Partial<GCodeViewerOptions>>(
        () => ({
            ...BASE_OPTIONS,
            machineBed: buildMachineBedOptions({ ignoreUserToggle: true }),
            render: {
                antialias: true,
                theme: buildViewerTheme(currentViewerThemeName()),
            },
        }),
        // buildMachineBedOptions reads the store; the key tracks its inputs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [machineBedKey],
    );

    // The gviewer handle throws until its viewer exists.
    const withViewer = (fn: (viewer: GCodeViewerHandle) => void) => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        try {
            fn(viewer);
        } catch {
            // Not mounted yet, or already disposed.
        }
    };

    const focusOrDefer = () => {
        const el = containerRef.current;
        if (!el || el.clientWidth === 0 || el.clientHeight === 0) {
            pendingFocusRef.current = true;
            return;
        }
        pendingFocusRef.current = false;
        withViewer((v) => v.focusToModel());
    };

    const machineReadyForJog = () =>
        isConnectedRef.current &&
        activeStateRef.current === GRBL_ACTIVE_STATE_IDLE;

    const disarmJog = () => {
        if (!jogArmedRef.current) return;
        const el = containerRef.current;
        if (jogHandlerRef.current) {
            el?.removeEventListener('pointerup', jogHandlerRef.current);
        }
        jogHandlerRef.current = null;
        withViewer((v) => v.setPanZoomEnabled(true));
        jogArmedRef.current = false;
        onJogArmedChange?.(false);
    };

    const armJog = () => {
        if (jogArmedRef.current) return;
        if (!machineReadyForJog()) {
            toast.info(MACHINE_NOT_READY_MESSAGE, {
                position: 'bottom-right',
            });
            return;
        }
        const el = containerRef.current;
        if (!el) return;

        // One-shot: the next tap commits the move (or is dropped, if the
        // machine stopped being ready) and disarms, mirroring the desktop's
        // "Move To Here" gesture.
        const handlePointerUp = (e: PointerEvent) => {
            disarmJog();
            if (!machineReadyForJog()) {
                toast.info(MACHINE_NOT_READY_MESSAGE, {
                    position: 'bottom-right',
                });
                return;
            }
            withViewer((v) => {
                const world = v.screenToWorld(e.clientX, e.clientY);
                if (!world) return;
                const x = Number(world.x.toFixed(3));
                const y = Number(world.y.toFixed(3));
                const unitModal =
                    unitsRef.current === METRIC_UNITS ? 'G21' : 'G20';
                controller.command(
                    'gcode:safe',
                    getSafeXYMoveCode(x, y),
                    unitModal,
                );
                toast.success(`Moving to X${x.toFixed(2)} Y${y.toFixed(2)}`, {
                    position: 'bottom-right',
                });
            });
        };

        jogHandlerRef.current = handlePointerUp;
        el.addEventListener('pointerup', handlePointerUp);
        withViewer((v) => v.setPanZoomEnabled(false));
        jogArmedRef.current = true;
        onJogArmedChange?.(true);
    };

    useImperativeHandle(
        ref,
        () => ({
            focusToModel: () => withViewer((v) => v.focusToModel()),
            focusToMachineBed: () => withViewer((v) => v.focusToMachineBed()),
            // gviewer has no direct "center on point" call; engaging follow
            // for one setBitPosition pans camera+target onto the bit while
            // holding the current camera offset (zoom/angle) constant, then
            // disengaging leaves it a one-shot recenter rather than tracking.
            focusToBit: () =>
                withViewer((v) => {
                    v.setCameraFollowEnabled(true);
                    v.setBitPosition(lastPositionRef.current, {
                        immediate: true,
                    });
                    v.setCameraFollowEnabled(false);
                }),
            armJog,
            disarmJog,
        }),
        // Methods only close over refs/the viewer handle, so they stay stable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    // Disarm on unmount so a stale listener never outlives the container.
    useEffect(() => disarmJog, []);

    useEffect(() => {
        const token = pubsub.subscribe('file:load', (_msg, data) => {
            if (!data?.svgSegmentGroups) return;
            withViewer((v) =>
                v.loadFromPrecomputedGroups(
                    data.svgSegmentGroups,
                    data.svgMeta,
                ),
            );
            focusOrDefer();
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {
            if (pendingFocusRef.current) focusOrDefer();
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!fileLoaded) {
            pendingFocusRef.current = false;
            withViewer((v) => v.unload());
        }
    }, [fileLoaded]);

    useEffect(() => {
        withViewer((v) => v.setBitVisible(isConnected));
    }, [isConnected]);

    useEffect(() => {
        const [x, y, z] = wposKey.split(',').map(Number);
        lastPositionRef.current = { x, y, z };
        withViewer((v) => v.setBitPosition({ x, y, z }));
    }, [wposKey]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <GCodeVisualizer
                ref={viewerRef}
                id="pendant-gl-vis"
                options={options}
                className="w-full h-full"
            />
        </div>
    );
}

const Visualizer = forwardRef(VisualizerImpl);

export default memo(Visualizer);
