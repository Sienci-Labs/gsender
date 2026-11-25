import {
    aMinusJog,
    aPlusJog,
    continuousJogAxis,
    zMinusJog,
    zPlusJog,
} from 'app/features/Jogging/utils/Jogging';
import cn from 'classnames';
import type { ComponentType, ReactNode } from 'react';
import {
    AxisLabel,
    JogActionButton,
    type JogTone,
    PRESET_META,
    useJogControls,
} from '../../jog/jogShared';
import { JogAMinus, JogAPlus, JogZDown, JogZUp } from '../../jog/jogIcons';

// Axis buttons rest on a light tint of their axis colour so they read as
// "moves the machine" (desktop uses a solid fill); pressing goes solid.
const TONE: Record<JogTone, string> = {
    neutral: 'bg-surface-raised border-outline-subtle text-content-muted',
    x: 'bg-axis-x/[0.07] hover:bg-axis-x/[0.13] border-axis-x text-axis-x',
    y: 'bg-axis-y/[0.07] hover:bg-axis-y/[0.13] border-axis-y text-axis-y',
    z: 'bg-axis-z/[0.07] hover:bg-axis-z/[0.13] border-axis-z text-axis-z',
    a: 'bg-axis-a/[0.07] hover:bg-axis-a/[0.13] border-axis-a text-axis-a',
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
            'jog-btn relative flex items-center justify-center rounded-xl font-mono font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-robin-500',
            tone === 'neutral' ? 'border' : 'border-2',
            active ? TONE_ACTIVE[tone] : TONE[tone],
            extra,
        );

/** Icon stacked over the axis label (X+, Z−, …). */
function AxisContent({
    icon: Icon,
    label,
    textClass,
    inline = false,
}: {
    icon?: ComponentType<{ className?: string }>;
    label: string;
    textClass: string;
    /** Icon beside the label — for the short Z/A buttons. */
    inline?: boolean;
}) {
    return (
        <span
            className={cn(
                'flex items-center justify-center leading-none',
                inline ? 'flex-row gap-1.5' : 'flex-col gap-0.5',
            )}
        >
            {Icon && (
                <Icon
                    className={cn('shrink-0', inline ? 'w-8 h-8' : 'w-9 h-9')}
                />
            )}
            {inline ? (
                <span className={textClass}>{label}</span>
            ) : (
                <AxisLabel label={label} className={textClass} />
            )}
        </span>
    );
}

const Z_A_TEXT = 'text-[22px]';

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
            content = (
                <AxisContent
                    icon={Icon}
                    label={button.label}
                    textClass="text-[20px]"
                />
            );
        } else if (Icon) {
            content = <Icon className="w-7 h-7" />;
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
            <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-3 gap-1.5">
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

            <div className="grid grid-cols-2 gap-1.5 shrink-0 mt-1.5">
                <div className="flex flex-col gap-1.5">
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
                        className={jogClass('z', 'h-[58px]')}
                    >
                        {() => (
                            <AxisContent
                                icon={JogZUp}
                                label="Z+"
                                textClass={Z_A_TEXT}
                                inline
                            />
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
                        className={jogClass('z', 'h-[58px]')}
                    >
                        {() => (
                            <AxisContent
                                icon={JogZDown}
                                label="Z−"
                                textClass={Z_A_TEXT}
                                inline
                            />
                        )}
                    </JogActionButton>
                </div>
                <div className="flex flex-col gap-1.5">
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
                        className={jogClass('a', 'h-[58px]')}
                    >
                        {() => (
                            <AxisContent
                                icon={JogAPlus}
                                label="A+"
                                textClass={Z_A_TEXT}
                                inline
                            />
                        )}
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
                        className={jogClass('a', 'h-[58px]')}
                    >
                        {() => (
                            <AxisContent
                                icon={JogAMinus}
                                label="A−"
                                textClass={Z_A_TEXT}
                                inline
                            />
                        )}
                    </JogActionButton>
                </div>
            </div>

            <div className="flex gap-1.5 shrink-0 mt-3">
                {PRESET_META.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setStepPreset(id)}
                        className={cn(
                            'flex-1 h-12 flex items-center justify-center gap-2 rounded-lg border font-mono text-xs font-bold tracking-[0.03em] uppercase transition-colors',
                            stepPreset === id
                                ? 'bg-robin-500 border-robin-500 text-white'
                                : 'bg-surface-raised border-outline-subtle text-content-muted',
                        )}
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
