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
    useState,
    type ForwardedRef,
} from 'react';
import { HOLD_MS, HOLD_TAP_MAX_MS } from '../hooks/useHoldToActivate';

export interface VisualizerHandle {
    focusToModel: () => void;
    focusToMachineBed: () => void;
    /** Pans the camera to center on the bit's last known position, preserving
     * the current zoom/angle — for when there's no toolpath to frame. */
    focusToBit: () => void;
    /** Arms tap-to-jog: the next full hold on the canvas sends a safe XY move
     * there. */
    armJog: () => void;
    disarmJog: () => void;
    /** Projects a world (work-coordinate) point to client px, tracking the
     * current pan/zoom; null until the viewer has a layout. */
    worldToScreen: (x: number, y: number) => { x: number; y: number } | null;
}

interface VisualizerProps {
    /** Fires whenever tap-to-jog is armed/disarmed, so an overlay button can
     * reflect the pressed state. */
    onJogArmedChange?: (armed: boolean) => void;
}

const MACHINE_NOT_READY_MESSAGE = 'Machine must be connected and idle to move';

/** A press that drifts further than this is a drag, not a target. */
const MOVE_SLOP_PX = 14;
// Big enough to show clearly around a fingertip
const RING_SIZE = 120;
const RING_STROKE = 6;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

type MoveHold = { x: number; y: number; progress: number };

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
        // Frame the model/bed with a little more room than gviewer's 1.1
        // default, so edges and corner targets aren't pinned to the stage edge
        topDownFitMargin: 1.3,
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
    const jogHandlersRef = useRef<{
        down: (e: PointerEvent) => void;
        move: (e: PointerEvent) => void;
        end: (e: PointerEvent) => void;
        contextMenu: (e: Event) => void;
    } | null>(null);
    const [moveHold, setMoveHold] = useState<MoveHold | null>(null);
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

    // Cleans up whatever press-and-hold is in flight; armJog fills it in.
    const cancelHoldRef = useRef<() => void>(() => {});

    const disarmJog = () => {
        if (!jogArmedRef.current) return;
        cancelHoldRef.current();
        const el = containerRef.current;
        const handlers = jogHandlersRef.current;
        if (handlers) {
            el?.removeEventListener('pointerdown', handlers.down);
            el?.removeEventListener('pointermove', handlers.move);
            el?.removeEventListener('pointerup', handlers.end);
            el?.removeEventListener('pointercancel', handlers.end);
            el?.removeEventListener('contextmenu', handlers.contextMenu);
        }
        jogHandlersRef.current = null;
        withViewer((v) => v.setPanZoomEnabled(true));
        jogArmedRef.current = false;
        onJogArmedChange?.(false);
    };

    const commitMove = (clientX: number, clientY: number) => {
        if (!machineReadyForJog()) {
            toast.info(MACHINE_NOT_READY_MESSAGE, {
                position: 'bottom-right',
            });
            return;
        }
        withViewer((v) => {
            const world = v.screenToWorld(clientX, clientY);
            if (!world) return;
            const x = Number(world.x.toFixed(3));
            const y = Number(world.y.toFixed(3));
            const unitModal = unitsRef.current === METRIC_UNITS ? 'G21' : 'G20';
            controller.command('gcode:safe', getSafeXYMoveCode(x, y), unitModal);
            if (navigator.vibrate) navigator.vibrate(12);
            toast.success(`Moving to X${x.toFixed(2)} Y${y.toFixed(2)}`, {
                position: 'bottom-right',
            });
        });
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

        // A press only becomes a move once held for HOLD_MS without
        // drifting; a ring around the finger shows the progress. A short or
        // dragged press is dropped and leaves the move armed.
        let press: {
            id: number;
            clientX: number;
            clientY: number;
            x: number;
            y: number;
            start: number;
            frame: number;
        } | null = null;

        const endPress = () => {
            if (press) cancelAnimationFrame(press.frame);
            press = null;
            setMoveHold(null);
        };
        cancelHoldRef.current = endPress;

        const tick = () => {
            if (!press) return;
            const progress = Math.min(
                1,
                (performance.now() - press.start) / HOLD_MS,
            );
            if (progress < 1) {
                setMoveHold({ x: press.x, y: press.y, progress });
                press.frame = requestAnimationFrame(tick);
                return;
            }
            const { clientX, clientY } = press;
            endPress();
            disarmJog();
            commitMove(clientX, clientY);
        };

        const down = (e: PointerEvent) => {
            if (press || !e.isPrimary) return;
            const rect = el.getBoundingClientRect();
            press = {
                id: e.pointerId,
                clientX: e.clientX,
                clientY: e.clientY,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                start: performance.now(),
                frame: 0,
            };
            setMoveHold({ x: press.x, y: press.y, progress: 0 });
            press.frame = requestAnimationFrame(tick);
        };

        const move = (e: PointerEvent) => {
            if (!press || e.pointerId !== press.id) return;
            if (
                Math.hypot(e.clientX - press.clientX, e.clientY - press.clientY) >
                MOVE_SLOP_PX
            ) {
                endPress();
            }
        };

        const end = (e: PointerEvent) => {
            if (!press || e.pointerId !== press.id) return;
            const wasTap = performance.now() - press.start < HOLD_TAP_MAX_MS;
            endPress();
            if (wasTap && e.type === 'pointerup') {
                toast.info('Hold on a spot to move there', {
                    id: 'pendant-move-hold-hint',
                    position: 'bottom-right',
                });
            }
        };

        // Android fires the long-press menu before the hold completes
        const contextMenu = (e: Event) => e.preventDefault();

        jogHandlersRef.current = { down, move, end, contextMenu };
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', end);
        el.addEventListener('pointercancel', end);
        el.addEventListener('contextmenu', contextMenu);
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
            worldToScreen: (x: number, y: number) => {
                let point: { x: number; y: number } | null = null;
                withViewer((v) => {
                    point = v.worldToScreen(x, y);
                });
                return point;
            },
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
        withViewer((v) => {
            v.setBitVisible(isConnected);
            // Show where work zero sits even before a file is loaded - only
            // meaningful with a machine connected
            v.setOriginVisible(isConnected);
        });
    }, [isConnected]);

    useEffect(() => {
        const [x, y, z] = wposKey.split(',').map(Number);
        lastPositionRef.current = { x, y, z };
        withViewer((v) => v.setBitPosition({ x, y, z }));
    }, [wposKey]);

    return (
        // touch-none/select-none: a held press must not turn into a browser
        // scroll, selection or long-press menu, which would cancel it
        <div
            ref={containerRef}
            className="relative w-full h-full touch-none select-none"
        >
            <GCodeVisualizer
                ref={viewerRef}
                id="pendant-gl-vis"
                options={options}
                className="w-full h-full"
            />
            {moveHold && (
                <svg
                    aria-hidden
                    width={RING_SIZE}
                    height={RING_SIZE}
                    viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                    className="absolute pointer-events-none -rotate-90 animate-[move-ring-flash_0.5s_ease-in-out_infinite] motion-reduce:animate-none"
                    style={{
                        left: moveHold.x - RING_SIZE / 2,
                        top: moveHold.y - RING_SIZE / 2,
                    }}
                >
                    <circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_R}
                        fill="none"
                        strokeWidth={RING_STROKE}
                        className="stroke-robin-500/30"
                    />
                    <circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_R}
                        fill="none"
                        strokeWidth={RING_STROKE}
                        strokeLinecap="round"
                        className="stroke-robin-400"
                        strokeDasharray={RING_C}
                        strokeDashoffset={RING_C * (1 - moveHold.progress)}
                    />
                    <circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={3}
                        className="fill-robin-400"
                    />
                </svg>
            )}
        </div>
    );
}

const Visualizer = forwardRef(VisualizerImpl);

export default memo(Visualizer);
