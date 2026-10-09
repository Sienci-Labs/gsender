import {
    aMinusJog,
    aPlusJog,
    continuousJogAxis,
    zMinusJog,
    zPlusJog,
} from 'app/features/Jogging/utils/Jogging';
import cn from 'classnames';
import type { ReactNode } from 'react';
import {
    JogActionButton,
    type JogTone,
    PRESET_META,
    useJogControls,
} from '../../jog/jogShared';

const TONE: Record<JogTone, string> = {
    neutral: 'border-outline-subtle text-content-muted',
    x: 'border-axis-x text-axis-x',
    y: 'border-axis-y text-axis-y',
    z: 'border-axis-z text-axis-z',
    a: 'border-axis-a text-axis-a',
};

const TONE_ACTIVE: Record<JogTone, string> = {
    neutral: 'border-outline bg-surface-hover text-content-primary',
    x: 'border-axis-x bg-axis-x text-white',
    y: 'border-axis-y bg-axis-y text-white',
    z: 'border-axis-z bg-axis-z text-white',
    a: 'border-axis-a bg-axis-a text-white',
};

const jogClass =
    (tone: JogTone, extra = '') =>
    (active: boolean) =>
        cn(
            'jog-btn relative flex items-center justify-center rounded-xl border font-mono font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-robin-500',
            active ? TONE_ACTIVE[tone] : cn('bg-surface-raised', TONE[tone]),
            extra,
        );

/** Precise / Normal / Rapid presets, the XY pad and a Z / A pad, on
 * JoggingCard's own jog logic. */
export default function JogArea({ className }: { className?: string }) {
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

    const renderXY = (index: number) => {
        const button = xyButtons[index];
        const Icon = button.icon;
        let content: ReactNode;
        if (button.label) {
            // Typographic minus, matching the mockup's X− / Y−
            content = (
                <span className="text-[15px]">
                    {button.label.replace('-', '−')}
                </span>
            );
        } else if (Icon) {
            content = <Icon className="w-[15px] h-[15px]" />;
        }
        return (
            <JogActionButton
                key={button.id}
                id={button.id}
                ariaLabel={button.ariaLabel}
                threshold={jogThreshold}
                disabled={!canJog}
                onShortPress={button.shortPress}
                onLongPress={button.longPress}
                className={jogClass(button.tone)}
            >
                {() => content}
            </JogActionButton>
        );
    };

    return (
        <div className={cn('flex flex-col min-h-0', className)}>
            <div className="flex gap-[5px] shrink-0 mb-2">
                {PRESET_META.map((preset) => (
                    <button
                        key={preset.id}
                        type="button"
                        onClick={() => setStepPreset(preset.id)}
                        className={cn(
                            'flex-1 py-[5px] rounded-sm border font-mono text-[8.5px] font-bold tracking-[0.03em] uppercase transition-colors',
                            stepPreset === preset.id
                                ? 'bg-robin-500 border-robin-500 text-white'
                                : 'bg-surface-raised border-outline-subtle text-content-muted',
                        )}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-3 gap-2">
                {renderXY(0)}
                {renderXY(1)}
                {renderXY(2)}
                {renderXY(3)}
                <div
                    aria-hidden
                    className="flex items-center justify-center text-content-disabled opacity-40"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    >
                        <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
                        <circle
                            cx="12"
                            cy="12"
                            r="1.4"
                            fill="currentColor"
                            stroke="none"
                        />
                    </svg>
                </div>
                {renderXY(4)}
                {renderXY(5)}
                {renderXY(6)}
                {renderXY(7)}
            </div>

            <div className="grid grid-cols-2 gap-2 shrink-0 mt-2">
                <div className="flex flex-col gap-2">
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
                        className={jogClass('z', 'h-[72px] text-[17px]')}
                    >
                        {() => 'Z+'}
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
                        className={jogClass('z', 'h-[72px] text-[17px]')}
                    >
                        {() => 'Z−'}
                    </JogActionButton>
                </div>
                <div className="flex flex-col gap-2">
                    <JogActionButton
                        id="a-plus"
                        ariaLabel={`Jog ${rotaryAxis} plus`}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={() =>
                            aPlusJog(aDistance, feedrate, false, isRotaryMode)
                        }
                        onLongPress={() =>
                            continuousJogAxis(
                                rotaryAxis === 'Y' ? { Y: 1 } : { A: 1 },
                                feedrate,
                            )
                        }
                        className={jogClass('a', 'h-[72px] text-[17px]')}
                    >
                        {() => 'A+'}
                    </JogActionButton>
                    <JogActionButton
                        id="a-minus"
                        ariaLabel={`Jog ${rotaryAxis} minus`}
                        threshold={jogThreshold}
                        disabled={!canJog}
                        onShortPress={() =>
                            aMinusJog(aDistance, feedrate, false, isRotaryMode)
                        }
                        onLongPress={() =>
                            continuousJogAxis(
                                rotaryAxis === 'Y' ? { Y: -1 } : { A: -1 },
                                feedrate,
                            )
                        }
                        className={jogClass('a', 'h-[72px] text-[17px]')}
                    >
                        {() => 'A−'}
                    </JogActionButton>
                </div>
            </div>
        </div>
    );
}
