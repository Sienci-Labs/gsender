import {
    aMinusJog,
    aPlusJog,
    continuousJogAxis,
    zMinusJog,
    zPlusJog,
} from 'app/features/Jogging/utils/Jogging';
import {
    ChevronDown,
    ChevronUp,
    Move,
    RotateCcw,
    RotateCw,
} from 'lucide-react';
import {
    JogActionButton,
    type JogTone,
    PRESET_META,
    useJogControls,
} from './jog/jogShared';

export default function JoggingCard() {
    const {
        stepPreset,
        setStepPreset,
        jogThreshold,
        canJog,
        isRotaryMode,
        rotaryAxis,
        zDistance,
        aDistance,
        feedrate,
        xyButtons,
    } = useJogControls();

    const baseButton =
        'jog-btn relative rounded-xl border-[3px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-robin-500';

    const toneClasses: Record<JogTone, string> = {
        neutral:
            'bg-white border-gray-400 text-gray-600 shadow-sm dark:bg-surface-raised dark:border-outline dark:text-content-muted dark:shadow-none',
        x: 'bg-white border-red-600 text-red-700 shadow-sm dark:bg-surface-raised dark:border-red-400 dark:text-red-400 dark:shadow-none',
        y: 'bg-white border-green-600 text-green-700 shadow-sm dark:bg-surface-raised dark:border-green-400 dark:text-green-400 dark:shadow-none',
        z: 'bg-white border-blue-600 text-blue-700 shadow-sm dark:bg-surface-raised dark:border-blue-400 dark:text-blue-400 dark:shadow-none',
        a: 'bg-white border-purple-500 text-purple-700 shadow-sm dark:bg-surface-raised dark:border-purple-400 dark:text-purple-400 dark:shadow-none',
    };

    const activeClasses: Record<JogTone, string> = {
        neutral:
            'border-gray-400 bg-gray-200 text-gray-700 dark:border-outline dark:bg-surface-raised dark:text-content-primary',
        x: 'border-red-600 bg-red-600 text-white dark:border-red-400 dark:bg-red-600 dark:text-white',
        y: 'border-green-600 bg-green-600 text-white dark:border-green-400 dark:bg-green-600 dark:text-white',
        z: 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-600 dark:text-white',
        a: 'border-purple-500 bg-purple-600 text-white dark:border-purple-400 dark:bg-purple-600 dark:text-white',
    };

    const hoverToneClasses: Record<JogTone, string> = {
        neutral:
            'hover:border-gray-500 hover:bg-gray-50 dark:hover:border-gray-500 dark:hover:bg-dark-lighter',
        x: 'hover:border-red-700 hover:bg-gray-50 dark:hover:border-red-300 dark:hover:bg-dark-lighter',
        y: 'hover:border-green-700 hover:bg-gray-50 dark:hover:border-green-300 dark:hover:bg-dark-lighter',
        z: 'hover:border-blue-700 hover:bg-gray-50 dark:hover:border-blue-300 dark:hover:bg-dark-lighter',
        a: 'hover:border-purple-600 hover:bg-gray-50 dark:hover:border-purple-300 dark:hover:bg-dark-lighter',
    };

    const axisPanel = 'p-0';

    return (
        <div className="rounded-[20px] bg-gray-100 border border-gray-300 dark:bg-surface-raised dark:border-outline p-[max(0.375rem,min(0.75rem,1.75vh))] flex flex-col gap-[max(0.375rem,min(0.75rem,1.75vh))]">
            <div className="flex items-center justify-center gap-1.5">
                {PRESET_META.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => setStepPreset(preset.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            stepPreset === preset.id
                                ? 'bg-robin-500 text-white border border-robin-500'
                                : 'bg-white dark:bg-surface-raised text-gray-600 dark:text-content-muted hover:text-gray-700 dark:hover:text-content-primary border border-gray-300 dark:border-outline'
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
                        className={(active) =>
                            `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                                active
                                    ? activeClasses[xyButtons[0].tone]
                                    : `${toneClasses[xyButtons[0].tone]} ${hoverToneClasses[xyButtons[0].tone]}`
                            }`
                        }
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
                        className={(active) =>
                            `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                                active
                                    ? activeClasses[xyButtons[1].tone]
                                    : `${toneClasses[xyButtons[1].tone]} ${hoverToneClasses[xyButtons[1].tone]}`
                            }`
                        }
                    >
                        {(active) => {
                            const Icon = xyButtons[1].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                    <span className="text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none">
                                        {xyButtons[1].label}
                                    </span>
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
                        className={(active) =>
                            `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                                active
                                    ? activeClasses[xyButtons[2].tone]
                                    : `${toneClasses[xyButtons[2].tone]} ${hoverToneClasses[xyButtons[2].tone]}`
                            }`
                        }
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
                        className={(active) =>
                            `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                                active
                                    ? activeClasses[xyButtons[3].tone]
                                    : `${toneClasses[xyButtons[3].tone]} ${hoverToneClasses[xyButtons[3].tone]}`
                            }`
                        }
                    >
                        {(active) => {
                            const Icon = xyButtons[3].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                    <span className="text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none">
                                        {xyButtons[3].label}
                                    </span>
                                </div>
                            );
                        }}
                    </JogActionButton>

                    <div
                        aria-hidden="true"
                        className="h-[clamp(2.5rem,7vh,3.75rem)] flex items-center justify-center"
                    >
                        <Move className="w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] text-gray-400/35 dark:text-content-muted/30" />
                    </div>

                    <JogActionButton
                        id={xyButtons[4].id}
                        ariaLabel={xyButtons[4].ariaLabel}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={xyButtons[4].shortPress}
                        onLongPress={xyButtons[4].longPress}
                        className={(active) =>
                            `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                                active
                                    ? activeClasses[xyButtons[4].tone]
                                    : `${toneClasses[xyButtons[4].tone]} ${hoverToneClasses[xyButtons[4].tone]}`
                            }`
                        }
                    >
                        {(active) => {
                            const Icon = xyButtons[4].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                    <span className="text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none">
                                        {xyButtons[4].label}
                                    </span>
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
                        className={(active) =>
                            `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                                active
                                    ? activeClasses[xyButtons[5].tone]
                                    : `${toneClasses[xyButtons[5].tone]} ${hoverToneClasses[xyButtons[5].tone]}`
                            }`
                        }
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
                        className={(active) =>
                            `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                                active
                                    ? activeClasses[xyButtons[6].tone]
                                    : `${toneClasses[xyButtons[6].tone]} ${hoverToneClasses[xyButtons[6].tone]}`
                            }`
                        }
                    >
                        {(active) => {
                            const Icon = xyButtons[6].icon!;
                            return (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                    <Icon className="w-[clamp(1rem,2.5vh,1.5rem)] h-[clamp(1rem,2.5vh,1.5rem)]" />
                                    <span className="text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none">
                                        {xyButtons[6].label}
                                    </span>
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
                        className={(active) =>
                            `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] ${
                                active
                                    ? activeClasses[xyButtons[7].tone]
                                    : `${toneClasses[xyButtons[7].tone]} ${hoverToneClasses[xyButtons[7].tone]}`
                            }`
                        }
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
                                onShortPress={() =>
                                    zPlusJog(zDistance, feedrate, false)
                                }
                                onLongPress={() =>
                                    continuousJogAxis({ Z: 1 }, feedrate)
                                }
                                className={(active) =>
                                    `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] w-full ${
                                        active
                                            ? activeClasses.z
                                            : `${toneClasses.z} ${hoverToneClasses.z}`
                                    }`
                                }
                            >
                                {(active) => (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                                        <ChevronUp
                                            className={`w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] ${active ? 'text-white' : canJog ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-content-muted'}`}
                                        />
                                        <span
                                            className={`text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none ${active ? 'text-white' : canJog ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-content-muted'}`}
                                        >
                                            Z+
                                        </span>
                                    </div>
                                )}
                            </JogActionButton>
                            <JogActionButton
                                id="z-minus"
                                ariaLabel="Jog Z minus"
                                threshold={jogThreshold}
                                disabled={!canJog}
                                onShortPress={() =>
                                    zMinusJog(zDistance, feedrate, false)
                                }
                                onLongPress={() =>
                                    continuousJogAxis({ Z: -1 }, feedrate)
                                }
                                className={(active) =>
                                    `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] w-full ${
                                        active
                                            ? activeClasses.z
                                            : `${toneClasses.z} ${hoverToneClasses.z}`
                                    }`
                                }
                            >
                                {(active) => (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                                        <ChevronDown
                                            className={`w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] ${active ? 'text-white' : canJog ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-content-muted'}`}
                                        />
                                        <span
                                            className={`text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none ${active ? 'text-white' : canJog ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-content-muted'}`}
                                        >
                                            Z-
                                        </span>
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
                                onShortPress={() =>
                                    aPlusJog(
                                        aDistance,
                                        feedrate,
                                        false,
                                        isRotaryMode,
                                    )
                                }
                                onLongPress={() =>
                                    continuousJogAxis(
                                        rotaryAxis === 'Y'
                                            ? { Y: 1 }
                                            : { A: 1 },
                                        feedrate,
                                    )
                                }
                                className={(active) =>
                                    `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] w-full ${
                                        active
                                            ? activeClasses.a
                                            : `${toneClasses.a} ${hoverToneClasses.a}`
                                    }`
                                }
                            >
                                {(active) => (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                                        <RotateCw
                                            className={`w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] ${active ? 'text-white' : canJog ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-content-muted'}`}
                                        />
                                        <span
                                            className={`text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none ${active ? 'text-white' : canJog ? 'text-purple-700 dark:text-purple-400' : 'text-gray-400 dark:text-content-muted'}`}
                                        >
                                            A+
                                        </span>
                                    </div>
                                )}
                            </JogActionButton>
                            <JogActionButton
                                id="a-minus"
                                ariaLabel={`Jog ${rotaryAxis} minus`}
                                threshold={jogThreshold}
                                disabled={!canJog}
                                onShortPress={() =>
                                    aMinusJog(
                                        aDistance,
                                        feedrate,
                                        false,
                                        isRotaryMode,
                                    )
                                }
                                onLongPress={() =>
                                    continuousJogAxis(
                                        rotaryAxis === 'Y'
                                            ? { Y: -1 }
                                            : { A: -1 },
                                        feedrate,
                                    )
                                }
                                className={(active) =>
                                    `${baseButton} h-[clamp(2.5rem,7vh,3.75rem)] w-full ${
                                        active
                                            ? activeClasses.a
                                            : `${toneClasses.a} ${hoverToneClasses.a}`
                                    }`
                                }
                            >
                                {(active) => (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                                        <RotateCcw
                                            className={`w-[clamp(0.875rem,2vh,1.25rem)] h-[clamp(0.875rem,2vh,1.25rem)] ${active ? 'text-white' : canJog ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-content-muted'}`}
                                        />
                                        <span
                                            className={`text-[clamp(0.875rem,2.2vh,1.25rem)] font-semibold leading-none ${active ? 'text-white' : canJog ? 'text-purple-700 dark:text-purple-400' : 'text-gray-400 dark:text-content-muted'}`}
                                        >
                                            A-
                                        </span>
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
