import cn from 'classnames';
import { useHoldToActivate } from '../../../hooks/useHoldToActivate';

type Tone = 'robin' | 'laser';

export interface SegmentedOption<T extends string> {
    value: T;
    label: string;
    /** Require press-and-hold instead of a tap (e.g. starting the spindle). */
    hold?: boolean;
    /** Bubble text for a tap on a hold option. */
    holdHint?: string;
}

const segmentClass = (active: boolean, tone: Tone) =>
    cn(
        'relative overflow-hidden flex-1 py-1.5 rounded-sm font-mono text-[9.5px] tracking-[0.04em] uppercase transition-colors disabled:opacity-40',
        active
            ? tone === 'laser'
                ? 'bg-laser/25 text-purple-200'
                : 'bg-robin-600/20 text-robin-400'
            : 'text-content-disabled',
    );

function HoldSegment({
    label,
    hint,
    active,
    disabled,
    tone,
    onActivate,
}: {
    label: string;
    hint: string;
    active: boolean;
    disabled?: boolean;
    tone: Tone;
    onActivate: () => void;
}) {
    const { progress, hintNode, bind } = useHoldToActivate(onActivate, {
        disabled,
        hint,
    });

    return (
        <button
            type="button"
            disabled={disabled}
            aria-label={hint}
            {...bind}
            className={cn(segmentClass(active, tone), 'select-none touch-none')}
        >
            <span
                aria-hidden
                className={cn(
                    'absolute inset-y-0 left-0 pointer-events-none',
                    tone === 'laser' ? 'bg-laser/40' : 'bg-robin-500/35',
                )}
                style={{ width: `${progress * 100}%` }}
            />
            <span className="relative">{label}</span>
            {hintNode}
        </button>
    );
}

/** Small segmented toggle (Manual / Probe, CW / CCW / Off). Options marked
 * `hold` need a press-and-hold; the rest fire on tap. */
export default function Segmented<T extends string>({
    value,
    onChange,
    options,
    disabled,
    tone = 'robin',
}: {
    value: T | null;
    onChange: (value: T) => void;
    options: SegmentedOption<T>[];
    disabled?: boolean;
    tone?: Tone;
}) {
    return (
        <div
            className={cn(
                'flex gap-1 p-[3px] rounded-md border bg-surface-raised',
                tone === 'laser' ? 'border-laser/40' : 'border-outline-subtle',
            )}
        >
            {options.map((option) =>
                option.hold ? (
                    <HoldSegment
                        key={option.value}
                        label={option.label}
                        hint={option.holdHint ?? `Hold for ${option.label}`}
                        active={value === option.value}
                        disabled={disabled}
                        tone={tone}
                        onActivate={() => onChange(option.value)}
                    />
                ) : (
                    <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(option.value)}
                        className={segmentClass(value === option.value, tone)}
                    >
                        {option.label}
                    </button>
                ),
            )}
        </div>
    );
}
