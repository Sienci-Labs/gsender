import { useEffect, useRef, useState, type ComponentType, type PointerEvent } from 'react';
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

const STEP_PRESETS = [
    { id: 'precise', label: 'Precise', value: '0.1' },
    { id: 'normal', label: 'Normal', value: '1.0' },
    { id: 'rapid', label: 'Rapid', value: '10' },
] as const;

type JogTone = 'neutral' | 'x' | 'y' | 'z' | 'a';

type GridButton = {
    id: string;
    label?: string;
    icon: ComponentType<{ className?: string }>;
    tone: JogTone;
    center?: boolean;
};

const XY_GRID_BUTTONS: GridButton[] = [
    { id: 'xy-up-left', icon: ArrowUpLeft, tone: 'neutral' },
    { id: 'xy-y-plus', label: 'Y+', icon: ChevronUp, tone: 'y' },
    { id: 'xy-up-right', icon: ArrowUpRight, tone: 'neutral' },
    { id: 'xy-x-minus', label: 'X-', icon: ChevronLeft, tone: 'x' },
    { id: 'xy-center', icon: Move, tone: 'neutral', center: true },
    { id: 'xy-x-plus', label: 'X+', icon: ChevronRight, tone: 'x' },
    { id: 'xy-down-left', icon: ArrowDownLeft, tone: 'neutral' },
    { id: 'xy-y-minus', label: 'Y-', icon: ChevronDown, tone: 'y' },
    { id: 'xy-down-right', icon: ArrowDownRight, tone: 'neutral' },
];

const QUICK_PRESS_MS = 110;

export default function JoggingCard() {
    const [stepPreset, setStepPreset] = useState<(typeof STEP_PRESETS)[number]['id']>('normal');
    const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
    const activeButtonIdRef = useRef<string | null>(null);
    const releaseTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (releaseTimerRef.current !== null) {
                window.clearTimeout(releaseTimerRef.current);
            }
        };
    }, []);

    const clearReleaseTimer = () => {
        if (releaseTimerRef.current !== null) {
            window.clearTimeout(releaseTimerRef.current);
            releaseTimerRef.current = null;
        }
    };

    const beginPress = (id: string) => {
        clearReleaseTimer();
        activeButtonIdRef.current = id;
        setActiveButtonId(id);
    };

    const finishPress = (id: string) => {
        if (activeButtonIdRef.current !== id) return;
        clearReleaseTimer();
        releaseTimerRef.current = window.setTimeout(() => {
            if (activeButtonIdRef.current === id) {
                activeButtonIdRef.current = null;
                setActiveButtonId(null);
            }
            releaseTimerRef.current = null;
        }, QUICK_PRESS_MS);
    };

    const cancelPress = (id: string) => {
        clearReleaseTimer();
        if (activeButtonIdRef.current === id) {
            activeButtonIdRef.current = null;
            setActiveButtonId(null);
        }
    };

    const handlePointerDown = (id: string, event: PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;
        beginPress(id);
    };

    const baseButton =
        'jog-btn relative rounded-2xl border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-robin-500';

    const toneClasses: Record<JogTone, string> = {
        neutral: 'bg-white border-gray-200 text-gray-500 dark:bg-dark dark:border-dark-lighter dark:text-gray-400',
        x: 'bg-white border-red-300 text-red-600 dark:bg-dark dark:border-dark-lighter dark:text-red-400',
        y: 'bg-white border-green-300 text-green-600 dark:bg-dark dark:border-dark-lighter dark:text-green-400',
        z: 'bg-white border-blue-300 text-blue-600 dark:bg-dark dark:border-dark-lighter dark:text-blue-400',
        a: 'bg-white border-purple-300 text-purple-600 dark:bg-dark dark:border-dark-lighter dark:text-purple-400',
    };

    const activeClasses: Record<JogTone, string> = {
        neutral: 'jog-btn-active border-gray-300 bg-gray-200 text-gray-700 dark:border-gray-500 dark:bg-dark-lighter dark:text-gray-100',
        x: 'jog-btn-active border-red-500 bg-red-600 text-white dark:border-red-400 dark:bg-red-600 dark:text-white',
        y: 'jog-btn-active border-green-500 bg-green-600 text-white dark:border-green-400 dark:bg-green-600 dark:text-white',
        z: 'jog-btn-active border-blue-500 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-600 dark:text-white',
        a: 'jog-btn-active border-purple-500 bg-purple-600 text-white dark:border-purple-400 dark:bg-purple-600 dark:text-white',
    };
    const hoverToneClasses: Record<JogTone, string> = {
        neutral: 'hover:border-gray-300 hover:bg-gray-100 dark:hover:border-gray-500 dark:hover:bg-dark-lighter',
        x: 'hover:border-red-400 hover:bg-gray-100 dark:hover:border-red-500 dark:hover:bg-dark-lighter',
        y: 'hover:border-green-400 hover:bg-gray-100 dark:hover:border-green-500 dark:hover:bg-dark-lighter',
        z: 'hover:border-blue-400 hover:bg-gray-100 dark:hover:border-blue-500 dark:hover:bg-dark-lighter',
        a: 'hover:border-purple-400 hover:bg-gray-100 dark:hover:border-purple-500 dark:hover:bg-dark-lighter',
    };

    const axisPanel = 'rounded-2xl border border-gray-200 dark:border-dark-lighter bg-gray-50 dark:bg-dark p-2';

    return (
        <div className="rounded-xl bg-white border border-gray-200 dark:bg-dark-darker dark:border-dark-lighter p-4 flex flex-col gap-4">
            {/* Step size selector */}
            <div className="flex items-center justify-center gap-1.5">
                {STEP_PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => setStepPreset(preset.id)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            stepPreset === preset.id
                                ? 'bg-robin-600 text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-dark-lighter'
                        }`}
                        data-step-value={preset.value}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {/* XY matrix */}
                <div className="grid grid-cols-3 gap-2">
                    {XY_GRID_BUTTONS.map((button) => {
                        const Icon = button.icon;
                        const isActive = activeButtonId === button.id;
                        return (
                            <button
                                key={button.id}
                                onPointerDown={(event) => handlePointerDown(button.id, event)}
                                onPointerUp={() => finishPress(button.id)}
                                onPointerCancel={() => cancelPress(button.id)}
                                onPointerLeave={() => cancelPress(button.id)}
                                onBlur={() => cancelPress(button.id)}
                                onKeyDown={(event) => {
                                    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                                        event.preventDefault();
                                        beginPress(button.id);
                                    }
                                }}
                                onKeyUp={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        finishPress(button.id);
                                    }
                                }}
                                className={`${baseButton} h-16 ${
                                    isActive
                                        ? activeClasses[button.tone]
                                        : button.center
                                          ? 'border-dashed bg-gray-100 text-gray-500 dark:bg-dark dark:text-gray-400 hover:border-gray-300 hover:bg-gray-200 dark:hover:border-gray-500 dark:hover:bg-dark-lighter'
                                          : `${toneClasses[button.tone]} ${hoverToneClasses[button.tone]}`
                                }`}
                                aria-label={button.label ?? button.id}
                            >
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-6 h-6" />
                                    {button.label && <span className="text-xl font-semibold leading-none">{button.label}</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Z + A axis controls */}
                <div className="grid grid-cols-2 gap-2">
                    <div className={axisPanel}>
                        <div className="space-y-1.5">
                            {[
                                { id: 'z-plus', label: 'Z+', Icon: ChevronUp },
                                { id: 'z-minus', label: 'Z-', Icon: ChevronDown },
                            ].map(({ id, label, Icon }) => {
                                const isActive = activeButtonId === id;
                                return (
                                    <button
                                        key={id}
                                        onPointerDown={(event) => handlePointerDown(id, event)}
                                        onPointerUp={() => finishPress(id)}
                                        onPointerCancel={() => cancelPress(id)}
                                        onPointerLeave={() => cancelPress(id)}
                                        onBlur={() => cancelPress(id)}
                                        onKeyDown={(event) => {
                                            if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                                                event.preventDefault();
                                                beginPress(id);
                                            }
                                        }}
                                        onKeyUp={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                finishPress(id);
                                            }
                                        }}
                                        className={`${baseButton} h-11 w-full ${
                                            isActive
                                                ? activeClasses.z
                                                : `${toneClasses.z} hover:border-blue-400 hover:bg-gray-100 dark:hover:border-blue-500 dark:hover:bg-dark-lighter`
                                        }`}
                                        aria-label={label}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-0.5">
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
                                            <span className={`text-xl font-semibold leading-none ${isActive ? 'text-white' : 'text-blue-700 dark:text-blue-300'}`}>{label}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className={axisPanel}>
                        <div className="space-y-1.5">
                            {[
                                { id: 'a-plus', label: 'A+', Icon: RotateCw },
                                { id: 'a-minus', label: 'A-', Icon: RotateCcw },
                            ].map(({ id, label, Icon }) => {
                                const isActive = activeButtonId === id;
                                return (
                                    <button
                                        key={id}
                                        onPointerDown={(event) => handlePointerDown(id, event)}
                                        onPointerUp={() => finishPress(id)}
                                        onPointerCancel={() => cancelPress(id)}
                                        onPointerLeave={() => cancelPress(id)}
                                        onBlur={() => cancelPress(id)}
                                        onKeyDown={(event) => {
                                            if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                                                event.preventDefault();
                                                beginPress(id);
                                            }
                                        }}
                                        onKeyUp={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                finishPress(id);
                                            }
                                        }}
                                        className={`${baseButton} h-11 w-full ${
                                            isActive
                                                ? activeClasses.a
                                                : `${toneClasses.a} hover:border-purple-400 hover:bg-gray-100 dark:hover:border-purple-500 dark:hover:bg-dark-lighter`
                                        }`}
                                        aria-label={label}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-0.5">
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-purple-500 dark:text-purple-400'}`} />
                                            <span className={`text-xl font-semibold leading-none ${isActive ? 'text-white' : 'text-purple-700 dark:text-purple-300'}`}>{label}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
