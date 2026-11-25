import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    IMPERIAL_UNITS,
    WORKFLOW_STATE_RUNNING,
    WORKSPACE_MODE,
} from 'app/constants';
import {
    continuousJogAxis,
    stopContinuousJog,
    xMinusJog,
    xMinusYMinus,
    xMinusYPlus,
    xPlusJog,
    xPlusYMinus,
    xPlusYPlus,
    yMinusJog,
    yPlusJog,
} from 'app/features/Jogging/utils/Jogging';
import { convertValue } from 'app/features/Jogging/utils/units';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import store from 'app/store';
import type { RootState } from 'app/store/redux';
import { Rabbit, Rocket, Turtle } from 'lucide-react';
import {
    type ComponentType,
    type PointerEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { LongPressCallbackReason, useLongPress } from 'use-long-press';
import {
    JogArrowDown,
    JogArrowDownLeft,
    JogArrowDownRight,
    JogArrowLeft,
    JogArrowRight,
    JogArrowUp,
    JogArrowUpLeft,
    JogArrowUpRight,
} from './jogIcons';

// Shared by JoggingCard and the carve screen's JogArea.

export type JogPresetId = 'precise' | 'normal' | 'rapid';
export type JogTone = 'neutral' | 'x' | 'y' | 'z' | 'a';

type JogConfig = {
    xyStep: number;
    zStep: number;
    aStep: number;
    feedrate: number;
};

export type JogButtonConfig = {
    id: string;
    label?: string;
    icon?: ComponentType<{ className?: string }>;
    tone: JogTone;
    shortPress: () => void;
    longPress: () => void;
    ariaLabel: string;
};

type JogActionButtonProps = {
    id: string;
    ariaLabel: string;
    threshold: number;
    disabled: boolean;
    className: string | ((active: boolean) => string);
    onShortPress: () => void;
    onLongPress: () => void;
    children: (active: boolean) => ReactNode;
};

const QUICK_PRESS_MS = 110;
const DEFAULT_THRESHOLD = 250;
// How far (px, per axis) a held finger may drift before the press ends. Big
// enough to absorb wobble and rolling the finger on a touchscreen, small
// enough that deliberately sliding well away still stops the jog.
const JOG_MOVE_TOLERANCE_PX = 64;

export const PRESET_META: {
    id: JogPresetId;
    label: string;
    icon: ComponentType<{ className?: string }>;
}[] = [
    { id: 'precise', label: 'Precise', icon: Turtle },
    { id: 'normal', label: 'Normal', icon: Rabbit },
    { id: 'rapid', label: 'Rapid', icon: Rocket },
];

const DEFAULT_JOG_CONFIGS: Record<JogPresetId, JogConfig> = {
    precise: { xyStep: 0.5, zStep: 0.1, aStep: 0.5, feedrate: 1000 },
    normal: { xyStep: 5, zStep: 2, aStep: 5, feedrate: 3000 },
    rapid: { xyStep: 20, zStep: 10, aStep: 20, feedrate: 5000 },
};

function parsePositiveNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}

function getThresholdFromStore(): number {
    return parsePositiveNumber(
        store.get('widgets.axes.jog.threshold', DEFAULT_THRESHOLD),
        DEFAULT_THRESHOLD,
    );
}

function getPresetFromStore(preset: JogPresetId, units: string): JogConfig {
    const defaults = DEFAULT_JOG_CONFIGS[preset];
    const raw = store.get(
        `widgets.axes.jog.${preset}`,
        defaults,
    ) as Partial<JogConfig> & { xaStep?: number };

    const jogConfig: JogConfig = {
        xyStep: parsePositiveNumber(raw?.xyStep, defaults.xyStep),
        zStep: parsePositiveNumber(raw?.zStep, defaults.zStep),
        aStep: parsePositiveNumber(raw?.aStep ?? raw?.xaStep, defaults.aStep),
        feedrate: parsePositiveNumber(raw?.feedrate, defaults.feedrate),
    };

    if (units === IMPERIAL_UNITS) {
        return {
            ...jogConfig,
            xyStep: convertValue(jogConfig.xyStep, 'mm', 'in'),
            zStep: convertValue(jogConfig.zStep, 'mm', 'in'),
            feedrate: convertValue(jogConfig.feedrate, 'mm', 'in'),
        };
    }

    return jogConfig;
}

function readJogConfigs(units: string): Record<JogPresetId, JogConfig> {
    return {
        precise: getPresetFromStore('precise', units),
        normal: getPresetFromStore('normal', units),
        rapid: getPresetFromStore('rapid', units),
    };
}

/**
 * Axis label (e.g. "Y+") with the letter centred and the sign hung off its
 * right edge, so the letter sits directly under the jog arrow above it.
 * Centring the whole "Y+" string puts the letter visibly left of the arrow.
 */
export function AxisLabel({
    label,
    className,
}: {
    label: string;
    className?: string;
}) {
    const letter = label.slice(0, -1);
    const sign = label.slice(-1).replace('-', '\u2212');
    return (
        <span className={`relative inline-block ${className ?? ''}`}>
            {letter}
            <span aria-hidden className="absolute left-full top-0">
                {sign}
            </span>
        </span>
    );
}

export function JogActionButton({
    id,
    ariaLabel,
    threshold,
    disabled,
    className,
    onShortPress,
    onLongPress,
    children,
}: JogActionButtonProps) {
    const [active, setActive] = useState(false);
    const quickReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const clearQuickReleaseTimer = () => {
        if (quickReleaseTimerRef.current !== null) {
            clearTimeout(quickReleaseTimerRef.current);
            quickReleaseTimerRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            clearQuickReleaseTimer();
        };
    }, []);

    const setActiveWithFlash = () => {
        clearQuickReleaseTimer();
        quickReleaseTimerRef.current = setTimeout(() => {
            setActive(false);
            quickReleaseTimerRef.current = null;
        }, QUICK_PRESS_MS);
    };

    // True from press start until the library reports finish/cancel.
    const pressingRef = useRef(false);
    // Set when the browser cancelled the gesture, so it isn't taken as a tap.
    const cancelledRef = useRef(false);

    const longPressBind = useLongPress(
        () => {
            onLongPress();
        },
        {
            threshold,
            cancelOnMovement: JOG_MOVE_TOLERANCE_PX,
            // The pointer is captured on press (below), so leaving the button
            // doesn't end the hold, and the release still comes back here.
            cancelOutsideElement: false,
            filterEvents: (event) => {
                if (disabled) {
                    return false;
                }
                if ('button' in event && typeof event.button === 'number') {
                    return event.button === 0;
                }
                return true;
            },
            onStart: () => {
                pressingRef.current = true;
                cancelledRef.current = false;
                clearQuickReleaseTimer();
                setActive(true);
            },
            onCancel: (_event, meta) => {
                pressingRef.current = false;
                if (
                    meta.reason ===
                        LongPressCallbackReason.CancelledByRelease &&
                    !cancelledRef.current
                ) {
                    onShortPress();
                    setActiveWithFlash();
                    return;
                }
                setActive(false);
            },
            onFinish: () => {
                pressingRef.current = false;
                stopContinuousJog();
                setActive(false);
            },
        },
    )();

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
        longPressBind.onPointerDown(event);
        if (!pressingRef.current) {
            return;
        }
        // Capture so the release reaches this button wherever the pointer ends
        // up — otherwise a mouse released outside would leave the jog running.
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Pointer already gone; pointercancel/lostpointercapture handle it.
        }
    };

    // The browser cancelled the gesture or capture was lost mid-press. Treat it
    // as a release so the library ends the hold (onFinish stops a running jog)
    // and resets, but never as a tap. After a normal release the press is
    // already over and this is a no-op, so it can't cut off a step jog.
    const handlePointerAbort = (event: PointerEvent<HTMLButtonElement>) => {
        if (!pressingRef.current) {
            return;
        }
        cancelledRef.current = true;
        longPressBind.onPointerUp(event);
    };

    const resolvedClassName =
        typeof className === 'function' ? className(active) : className;

    return (
        <button
            key={id}
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            // touch-none: stop the browser claiming a moving touch as a pan,
            // which would cancel the pointer mid-jog.
            className={`${resolvedClassName} touch-none select-none ${active ? 'jog-btn-active' : ''} ${disabled ? 'cursor-default' : ''}`}
            onContextMenu={(event) => event.preventDefault()}
            {...longPressBind}
            onPointerDown={handlePointerDown}
            onPointerCancel={handlePointerAbort}
            onLostPointerCapture={handlePointerAbort}
        >
            {children(active)}
        </button>
    );
}

/** Presets, store sync, canJog gating and the XY button set. */
export function useJogControls() {
    const { mode, units } = useWorkspaceState();
    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const workflowState = useTypedSelector(
        (state: RootState) => state.controller.workflow.state,
    );
    const activeState = useTypedSelector(
        (state: RootState) => state.controller.state.status?.activeState ?? '',
    );

    const [stepPreset, setStepPreset] = useState<JogPresetId>('normal');
    const [jogThreshold, setJogThreshold] = useState<number>(
        getThresholdFromStore(),
    );
    const [jogConfigs, setJogConfigs] = useState<
        Record<JogPresetId, JogConfig>
    >(() => readJogConfigs(units ?? 'mm'));

    useEffect(() => {
        const syncFromStore = () => {
            setJogThreshold(getThresholdFromStore());
            setJogConfigs(readJogConfigs(units ?? 'mm'));
        };

        syncFromStore();
        store.on('change', syncFromStore);
        return () => {
            store.removeListener('change', syncFromStore);
        };
    }, [units]);

    const isRotaryMode = mode === WORKSPACE_MODE.ROTARY;
    const canJog =
        isConnected &&
        workflowState !== WORKFLOW_STATE_RUNNING &&
        (activeState === GRBL_ACTIVE_STATE_IDLE ||
            activeState === GRBL_ACTIVE_STATE_JOG);

    const selectedJog = jogConfigs[stepPreset];
    const xyDistance = selectedJog.xyStep;
    const zDistance = selectedJog.zStep;
    const aDistance = selectedJog.aStep;
    const feedrate = selectedJog.feedrate;
    const rotaryAxis = isRotaryMode ? 'Y' : 'A';

    const xyButtons: JogButtonConfig[] = useMemo(
        () => [
            {
                id: 'xy-up-left',
                icon: JogArrowUpLeft,
                tone: 'neutral',
                shortPress: () => xMinusYPlus(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: -1, Y: 1 }, feedrate),
                ariaLabel: 'Jog X minus Y plus',
            },
            {
                id: 'xy-y-plus',
                label: 'Y+',
                icon: JogArrowUp,
                tone: 'y',
                shortPress: () => yPlusJog(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ Y: 1 }, feedrate),
                ariaLabel: 'Jog Y plus',
            },
            {
                id: 'xy-up-right',
                icon: JogArrowUpRight,
                tone: 'neutral',
                shortPress: () => xPlusYPlus(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: 1, Y: 1 }, feedrate),
                ariaLabel: 'Jog X plus Y plus',
            },
            {
                id: 'xy-x-minus',
                label: 'X-',
                icon: JogArrowLeft,
                tone: 'x',
                shortPress: () => xMinusJog(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: -1 }, feedrate),
                ariaLabel: 'Jog X minus',
            },
            {
                id: 'xy-x-plus',
                label: 'X+',
                icon: JogArrowRight,
                tone: 'x',
                shortPress: () => xPlusJog(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: 1 }, feedrate),
                ariaLabel: 'Jog X plus',
            },
            {
                id: 'xy-down-left',
                icon: JogArrowDownLeft,
                tone: 'neutral',
                shortPress: () => xMinusYMinus(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: -1, Y: -1 }, feedrate),
                ariaLabel: 'Jog X minus Y minus',
            },
            {
                id: 'xy-y-minus',
                label: 'Y-',
                icon: JogArrowDown,
                tone: 'y',
                shortPress: () => yMinusJog(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ Y: -1 }, feedrate),
                ariaLabel: 'Jog Y minus',
            },
            {
                id: 'xy-down-right',
                icon: JogArrowDownRight,
                tone: 'neutral',
                shortPress: () => xPlusYMinus(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: 1, Y: -1 }, feedrate),
                ariaLabel: 'Jog X plus Y minus',
            },
        ],
        [xyDistance, feedrate],
    );

    return {
        stepPreset,
        setStepPreset,
        jogThreshold,
        canJog,
        isRotaryMode,
        rotaryAxis,
        xyDistance,
        zDistance,
        aDistance,
        feedrate,
        xyButtons,
    };
}
