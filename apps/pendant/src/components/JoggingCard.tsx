import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import {
    ArrowDownLeft,
    ArrowDownRight,
    ArrowUpLeft,
    ArrowUpRight,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Move,
    RotateCcw,
    RotateCw,
} from 'lucide-react';
import { LongPressCallbackReason, useLongPress } from 'use-long-press';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import {
    aMinusJog,
    aPlusJog,
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
    zMinusJog,
    zPlusJog,
} from '@gsender/features/Jogging/utils/Jogging';
import { convertValue } from '@gsender/features/Jogging/utils/units';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import store from 'app/store';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    IMPERIAL_UNITS,
    WORKFLOW_STATE_RUNNING,
    WORKSPACE_MODE,
} from 'app/constants';

type JogPresetId = 'precise' | 'normal' | 'rapid';
type JogTone = 'neutral' | 'x' | 'y' | 'z' | 'a';

type JogConfig = {
    xyStep: number;
    zStep: number;
    aStep: number;
    feedrate: number;
};

type JogButtonConfig = {
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

const PRESET_META: { id: JogPresetId; label: string }[] = [
    { id: 'precise', label: 'Precise' },
    { id: 'normal', label: 'Normal' },
    { id: 'rapid', label: 'Rapid' },
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

function getPresetFromStore(
    preset: JogPresetId,
    units: string,
): JogConfig {
    const defaults = DEFAULT_JOG_CONFIGS[preset];
    const raw = store.get(`widgets.axes.jog.${preset}`, defaults) as Partial<JogConfig> & { xaStep?: number };

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

function JogActionButton({
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
    const quickReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const longPressBind = useLongPress(
        () => {
            onLongPress();
        },
        {
            threshold,
            cancelOnMovement: true,
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
                clearQuickReleaseTimer();
                setActive(true);
            },
            onCancel: (_event, meta) => {
                if (meta.reason === LongPressCallbackReason.CancelledByRelease) {
                    onShortPress();
                    setActiveWithFlash();
                    return;
                }
                setActive(false);
            },
            onFinish: () => {
                stopContinuousJog();
                setActive(false);
            },
        },
    )();

    const resolvedClassName = typeof className === 'function'
        ? className(active)
        : className;

    return (
        <button
            key={id}
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            className={`${resolvedClassName} ${active ? 'jog-btn-active' : ''} ${disabled ? 'cursor-default' : ''}`}
            onContextMenu={(event) => event.preventDefault()}
            {...longPressBind}
        >
            {children(active)}
        </button>
    );
}

export default function JoggingCard() {
    const { mode, units } = useWorkspaceState();
    const isConnected = useTypedSelector((state: RootState) => state.connection.isConnected);
    const workflowState = useTypedSelector((state: RootState) => state.controller.workflow.state);
    const activeState = useTypedSelector((state: RootState) => state.controller.state.status?.activeState ?? '');

    const [stepPreset, setStepPreset] = useState<JogPresetId>('normal');
    const [jogThreshold, setJogThreshold] = useState<number>(getThresholdFromStore());
    const [jogConfigs, setJogConfigs] = useState<Record<JogPresetId, JogConfig>>(
        () => readJogConfigs(units ?? 'mm'),
    );

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

    const baseButton =
        'jog-btn relative rounded-2xl border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-robin-500';

    const toneClasses: Record<JogTone, string> = {
        neutral: 'bg-gray-50 border-gray-300 text-gray-400 shadow-sm dark:bg-dark dark:border-dark-lighter dark:text-gray-400 dark:shadow-none',
        x: 'bg-gray-50 border-red-400 text-red-600 shadow-sm dark:bg-dark dark:border-dark-lighter dark:text-red-400 dark:shadow-none',
        y: 'bg-gray-50 border-green-400 text-green-600 shadow-sm dark:bg-dark dark:border-dark-lighter dark:text-green-400 dark:shadow-none',
        z: 'bg-gray-50 border-blue-400 text-blue-600 shadow-sm dark:bg-dark dark:border-dark-lighter dark:text-blue-400 dark:shadow-none',
        a: 'bg-gray-50 border-purple-400 text-purple-600 shadow-sm dark:bg-dark dark:border-dark-lighter dark:text-purple-400 dark:shadow-none',
    };

    const activeClasses: Record<JogTone, string> = {
        neutral: 'border-gray-300 bg-gray-200 text-gray-700 dark:border-gray-500 dark:bg-dark-lighter dark:text-gray-100',
        x: 'border-red-500 bg-red-600 text-white dark:border-red-400 dark:bg-red-600 dark:text-white',
        y: 'border-green-500 bg-green-600 text-white dark:border-green-400 dark:bg-green-600 dark:text-white',
        z: 'border-blue-500 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-600 dark:text-white',
        a: 'border-purple-500 bg-purple-600 text-white dark:border-purple-400 dark:bg-purple-600 dark:text-white',
    };

    const hoverToneClasses: Record<JogTone, string> = {
        neutral: 'hover:border-gray-300 hover:bg-gray-100 dark:hover:border-gray-500 dark:hover:bg-dark-lighter',
        x: 'hover:border-red-400 hover:bg-gray-100 dark:hover:border-red-500 dark:hover:bg-dark-lighter',
        y: 'hover:border-green-400 hover:bg-gray-100 dark:hover:border-green-500 dark:hover:bg-dark-lighter',
        z: 'hover:border-blue-400 hover:bg-gray-100 dark:hover:border-blue-500 dark:hover:bg-dark-lighter',
        a: 'hover:border-purple-400 hover:bg-gray-100 dark:hover:border-purple-500 dark:hover:bg-dark-lighter',
    };

    const axisPanel = 'rounded-2xl border border-gray-200 dark:border-dark-lighter bg-gray-50 dark:bg-dark p-2';

    const xyButtons: JogButtonConfig[] = useMemo(
        () => [
            {
                id: 'xy-up-left',
                icon: ArrowUpLeft,
                tone: 'neutral',
                shortPress: () => xMinusYPlus(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: -1, Y: 1 }, feedrate),
                ariaLabel: 'Jog X minus Y plus',
            },
            {
                id: 'xy-y-plus',
                label: 'Y+',
                icon: ChevronUp,
                tone: 'y',
                shortPress: () => yPlusJog(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ Y: 1 }, feedrate),
                ariaLabel: 'Jog Y plus',
            },
            {
                id: 'xy-up-right',
                icon: ArrowUpRight,
                tone: 'neutral',
                shortPress: () => xPlusYPlus(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: 1, Y: 1 }, feedrate),
                ariaLabel: 'Jog X plus Y plus',
            },
            {
                id: 'xy-x-minus',
                label: 'X-',
                icon: ChevronLeft,
                tone: 'x',
                shortPress: () => xMinusJog(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: -1 }, feedrate),
                ariaLabel: 'Jog X minus',
            },
            {
                id: 'xy-x-plus',
                label: 'X+',
                icon: ChevronRight,
                tone: 'x',
                shortPress: () => xPlusJog(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: 1 }, feedrate),
                ariaLabel: 'Jog X plus',
            },
            {
                id: 'xy-down-left',
                icon: ArrowDownLeft,
                tone: 'neutral',
                shortPress: () => xMinusYMinus(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: -1, Y: -1 }, feedrate),
                ariaLabel: 'Jog X minus Y minus',
            },
            {
                id: 'xy-y-minus',
                label: 'Y-',
                icon: ChevronDown,
                tone: 'y',
                shortPress: () => yMinusJog(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ Y: -1 }, feedrate),
                ariaLabel: 'Jog Y minus',
            },
            {
                id: 'xy-down-right',
                icon: ArrowDownRight,
                tone: 'neutral',
                shortPress: () => xPlusYMinus(xyDistance, feedrate, false),
                longPress: () => continuousJogAxis({ X: 1, Y: -1 }, feedrate),
                ariaLabel: 'Jog X plus Y minus',
            },
        ],
        [xyDistance, feedrate],
    );

    return (
        <div className="rounded-xl bg-white border border-gray-300 dark:bg-dark-darker dark:border-dark-lighter p-[max(0.375rem,min(0.75rem,1.75vh))] flex flex-col gap-[max(0.375rem,min(0.75rem,1.75vh))]">
            <div className="flex items-center justify-center gap-1.5">
                {PRESET_META.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => setStepPreset(preset.id)}
                        className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                            stepPreset === preset.id
                                ? 'bg-robin-500 text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white border border-gray-300 dark:border-dark-lighter'
                        }`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="space-y-[clamp(0.375rem,1.5vh,0.75rem)]">
                <div className="grid grid-cols-3 gap-2">
                    <JogActionButton
                        id={xyButtons[0].id}
                        ariaLabel={xyButtons[0].ariaLabel}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={xyButtons[0].shortPress}
                        onLongPress={xyButtons[0].longPress}
                        className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                            active
                                ? activeClasses[xyButtons[0].tone]
                                : `${toneClasses[xyButtons[0].tone]} ${hoverToneClasses[xyButtons[0].tone]}`
                        }`}
                    >
                        {(active) => {
                            const Icon = xyButtons[0].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                </div>
                            );
                        }}
                    </JogActionButton>

                    <JogActionButton
                        id={xyButtons[1].id}
                        ariaLabel={xyButtons[1].ariaLabel}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={xyButtons[1].shortPress}
                        onLongPress={xyButtons[1].longPress}
                        className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                            active
                                ? activeClasses[xyButtons[1].tone]
                                : `${toneClasses[xyButtons[1].tone]} ${hoverToneClasses[xyButtons[1].tone]}`
                        }`}
                    >
                        {(active) => {
                            const Icon = xyButtons[1].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                    <span className="text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none">{xyButtons[1].label}</span>
                                </div>
                            );
                        }}
                    </JogActionButton>

                    <JogActionButton
                        id={xyButtons[2].id}
                        ariaLabel={xyButtons[2].ariaLabel}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={xyButtons[2].shortPress}
                        onLongPress={xyButtons[2].longPress}
                        className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                            active
                                ? activeClasses[xyButtons[2].tone]
                                : `${toneClasses[xyButtons[2].tone]} ${hoverToneClasses[xyButtons[2].tone]}`
                        }`}
                    >
                        {(active) => {
                            const Icon = xyButtons[2].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                </div>
                            );
                        }}
                    </JogActionButton>

                    <JogActionButton
                        id={xyButtons[3].id}
                        ariaLabel={xyButtons[3].ariaLabel}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={xyButtons[3].shortPress}
                        onLongPress={xyButtons[3].longPress}
                        className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                            active
                                ? activeClasses[xyButtons[3].tone]
                                : `${toneClasses[xyButtons[3].tone]} ${hoverToneClasses[xyButtons[3].tone]}`
                        }`}
                    >
                        {(active) => {
                            const Icon = xyButtons[3].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                    <span className="text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none">{xyButtons[3].label}</span>
                                </div>
                            );
                        }}
                    </JogActionButton>

                    <div
                        aria-hidden="true"
                        className="h-[clamp(2.5rem,7vh,3.75rem)] flex items-center justify-center"
                    >
                        <Move className="w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] text-gray-400/35 dark:text-gray-500/30" />
                    </div>

                    <JogActionButton
                        id={xyButtons[4].id}
                        ariaLabel={xyButtons[4].ariaLabel}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={xyButtons[4].shortPress}
                        onLongPress={xyButtons[4].longPress}
                        className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                            active
                                ? activeClasses[xyButtons[4].tone]
                                : `${toneClasses[xyButtons[4].tone]} ${hoverToneClasses[xyButtons[4].tone]}`
                        }`}
                    >
                        {(active) => {
                            const Icon = xyButtons[4].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                    <span className="text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none">{xyButtons[4].label}</span>
                                </div>
                            );
                        }}
                    </JogActionButton>

                    <JogActionButton
                        id={xyButtons[5].id}
                        ariaLabel={xyButtons[5].ariaLabel}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={xyButtons[5].shortPress}
                        onLongPress={xyButtons[5].longPress}
                        className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                            active
                                ? activeClasses[xyButtons[5].tone]
                                : `${toneClasses[xyButtons[5].tone]} ${hoverToneClasses[xyButtons[5].tone]}`
                        }`}
                    >
                        {(active) => {
                            const Icon = xyButtons[5].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                </div>
                            );
                        }}
                    </JogActionButton>

                    <JogActionButton
                        id={xyButtons[6].id}
                        ariaLabel={xyButtons[6].ariaLabel}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={xyButtons[6].shortPress}
                        onLongPress={xyButtons[6].longPress}
                        className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                            active
                                ? activeClasses[xyButtons[6].tone]
                                : `${toneClasses[xyButtons[6].tone]} ${hoverToneClasses[xyButtons[6].tone]}`
                        }`}
                    >
                        {(active) => {
                            const Icon = xyButtons[6].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                    <span className="text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none">{xyButtons[6].label}</span>
                                </div>
                            );
                        }}
                    </JogActionButton>

                    <JogActionButton
                        id={xyButtons[7].id}
                        ariaLabel={xyButtons[7].ariaLabel}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={xyButtons[7].shortPress}
                        onLongPress={xyButtons[7].longPress}
                        className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                            active
                                ? activeClasses[xyButtons[7].tone]
                                : `${toneClasses[xyButtons[7].tone]} ${hoverToneClasses[xyButtons[7].tone]}`
                        }`}
                    >
                        {(active) => {
                            const Icon = xyButtons[7].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                </div>
                            );
                        }}
                    </JogActionButton>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className={axisPanel}>
                        <div className="space-y-1.5">
                            <JogActionButton
                                id="z-plus"
                                ariaLabel="Jog Z plus"
                                threshold={jogThreshold}
                                disabled={!canJog}
                                onShortPress={() => zPlusJog(zDistance, feedrate, false)}
                                onLongPress={() => continuousJogAxis({ Z: 1 }, feedrate)}
                                className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] w-full ${
                                    active ? activeClasses.z : `${toneClasses.z} ${hoverToneClasses.z}`
                                }`}
                            >
                                {(active) => (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                                        <ChevronUp className={`w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] ${active ? 'text-white' : canJog ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                        <span className={`text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none ${active ? 'text-white' : canJog ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>Z+</span>
                                    </div>
                                )}
                            </JogActionButton>
                            <JogActionButton
                                id="z-minus"
                                ariaLabel="Jog Z minus"
                                threshold={jogThreshold}
                                disabled={!canJog}
                                onShortPress={() => zMinusJog(zDistance, feedrate, false)}
                                onLongPress={() => continuousJogAxis({ Z: -1 }, feedrate)}
                                className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] w-full ${
                                    active ? activeClasses.z : `${toneClasses.z} ${hoverToneClasses.z}`
                                }`}
                            >
                                {(active) => (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                                        <ChevronDown className={`w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] ${active ? 'text-white' : canJog ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                        <span className={`text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none ${active ? 'text-white' : canJog ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>Z-</span>
                                    </div>
                                )}
                            </JogActionButton>
                        </div>
                    </div>

                    <div className={axisPanel}>
                        <div className="space-y-1.5">
                            <JogActionButton
                                id="a-plus"
                                ariaLabel={`Jog ${rotaryAxis} plus`}
                                threshold={jogThreshold}
                                disabled={!canJog}
                                onShortPress={() => aPlusJog(aDistance, feedrate, false, isRotaryMode)}
                                onLongPress={() => continuousJogAxis(rotaryAxis === 'Y' ? { Y: 1 } : { A: 1 }, feedrate)}
                                className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] w-full ${
                                    active ? activeClasses.a : `${toneClasses.a} ${hoverToneClasses.a}`
                                }`}
                            >
                                {(active) => (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                                        <RotateCw className={`w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] ${active ? 'text-white' : canJog ? 'text-purple-500 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                        <span className={`text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none ${active ? 'text-white' : canJog ? 'text-purple-700 dark:text-purple-300' : 'text-gray-400 dark:text-gray-500'}`}>A+</span>
                                    </div>
                                )}
                            </JogActionButton>
                            <JogActionButton
                                id="a-minus"
                                ariaLabel={`Jog ${rotaryAxis} minus`}
                                threshold={jogThreshold}
                                disabled={!canJog}
                                onShortPress={() => aMinusJog(aDistance, feedrate, false, isRotaryMode)}
                                onLongPress={() => continuousJogAxis(rotaryAxis === 'Y' ? { Y: -1 } : { A: -1 }, feedrate)}
                                className={(active) => `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] w-full ${
                                    active ? activeClasses.a : `${toneClasses.a} ${hoverToneClasses.a}`
                                }`}
                            >
                                {(active) => (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                                        <RotateCcw className={`w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] ${active ? 'text-white' : canJog ? 'text-purple-500 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                        <span className={`text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none ${active ? 'text-white' : canJog ? 'text-purple-700 dark:text-purple-300' : 'text-gray-400 dark:text-gray-500'}`}>A-</span>
                                    </div>
                                )}
                            </JogActionButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
