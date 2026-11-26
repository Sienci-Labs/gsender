import cn from 'classnames';
import {
    type ComponentType,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useHoldToActivate } from '../../../hooks/useHoldToActivate';

export type Tone = 'robin' | 'laser';
type Size = 'sm' | 'lg';

const FLASH_MS = 280;

/** Brief highlight after a tap, so an instant action (Stop, coolant off)
 * registers even when the resulting state looks the same. */
export function usePressFlash(): [boolean, () => void] {
    const [flashing, setFlashing] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);
    const trigger = useCallback(() => {
        clearTimeout(timer.current);
        setFlashing(true);
        timer.current = setTimeout(() => setFlashing(false), FLASH_MS);
    }, []);
    return [flashing, trigger];
}

/** Ring + tint shown while a tap flash is live. */
export const flashClass = (danger: boolean) =>
    danger
        ? 'ring-2 ring-red-500 bg-red-700/50 text-red-200'
        : 'ring-2 ring-robin-400 bg-robin-500/30';

export interface SegmentedOption<T extends string> {
    value: T;
    label: string;
    /** Require press-and-hold instead of a tap (e.g. starting the spindle). */
    hold?: boolean;
    /** Bubble text for a tap on a hold option. */
    holdHint?: string;
    /** Icon shown beside the label (large size only). */
    icon?: ComponentType<{ className?: string }>;
    /** Stop-style option: red face while idle (large size only). */
    danger?: boolean;
}

export const segmentClass = (
    active: boolean,
    tone: Tone,
    size: Size,
    danger: boolean,
) =>
    cn(
        'relative overflow-hidden flex-1 transition-colors disabled:opacity-40',
        size === 'lg'
            ? 'flex items-center justify-center gap-1.5 h-12 rounded-md border text-[13px] font-semibold tracking-[0.03em] uppercase transition-transform duration-75 active:scale-[0.96]'
            : 'py-1.5 rounded-sm font-mono text-[9.5px] tracking-[0.04em] uppercase',
        active && size === 'lg' && danger
            ? 'bg-red-900/45 border-red-600 text-red-300'
            : active
              ? tone === 'laser'
                  ? 'bg-laser/25 text-purple-200 border-laser/60'
                  : 'bg-robin-600/20 text-robin-400 border-robin-500'
              : size === 'lg'
                ? danger
                    ? 'bg-red-950/40 border-red-800/50 text-red-400'
                    : 'bg-surface-elevated border-outline-subtle text-content-secondary'
                : 'text-content-disabled',
    );

export function SegmentContent<T extends string>({
    option,
    size,
}: {
    option: SegmentedOption<T>;
    size: Size;
}) {
    const Icon = size === 'lg' ? option.icon : undefined;
    return (
        <span className="relative flex items-center justify-center gap-1.5">
            {Icon && <Icon className="w-5 h-5" />}
            {option.label}
        </span>
    );
}

export function HoldSegment<T extends string>({
    option,
    hint,
    active,
    disabled,
    tone,
    size,
    onActivate,
}: {
    option: SegmentedOption<T>;
    hint: string;
    active: boolean;
    disabled?: boolean;
    tone: Tone;
    size: Size;
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
            className={cn(
                segmentClass(active, tone, size, !!option.danger),
                'select-none touch-none',
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'absolute inset-y-0 left-0 pointer-events-none',
                    tone === 'laser' ? 'bg-laser/40' : 'bg-robin-500/35',
                )}
                style={{ width: `${progress * 100}%` }}
            />
            <SegmentContent option={option} size={size} />
            {hintNode}
        </button>
    );
}

export function TapSegment<T extends string>({
    option,
    active,
    disabled,
    tone,
    size,
    onActivate,
}: {
    option: SegmentedOption<T>;
    active: boolean;
    disabled?: boolean;
    tone: Tone;
    size: Size;
    onActivate: () => void;
}) {
    const [flashing, flash] = usePressFlash();
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => {
                if (size === 'lg') flash();
                onActivate();
            }}
            className={cn(
                segmentClass(active, tone, size, !!option.danger),
                flashing && flashClass(!!option.danger),
            )}
        >
            <SegmentContent option={option} size={size} />
        </button>
    );
}

/** Segmented toggle (Manual / Probe, CW / CCW / Off). Options marked `hold`
 * need a press-and-hold; the rest fire on tap. `size="lg"` renders separate
 * large touch buttons with optional icons. */
export default function Segmented<T extends string>({
    value,
    onChange,
    options,
    disabled,
    tone = 'robin',
    size = 'sm',
}: {
    value: T | null;
    onChange: (value: T) => void;
    options: SegmentedOption<T>[];
    disabled?: boolean;
    tone?: Tone;
    size?: Size;
}) {
    return (
        <div
            className={cn(
                'flex',
                size === 'lg'
                    ? 'gap-2'
                    : cn(
                          'gap-1 p-[3px] rounded-md border bg-surface-raised',
                          tone === 'laser'
                              ? 'border-laser/40'
                              : 'border-outline-subtle',
                      ),
            )}
        >
            {options.map((option) =>
                option.hold ? (
                    <HoldSegment
                        key={option.value}
                        option={option}
                        hint={option.holdHint ?? `Hold for ${option.label}`}
                        active={value === option.value}
                        disabled={disabled}
                        tone={tone}
                        size={size}
                        onActivate={() => onChange(option.value)}
                    />
                ) : (
                    <TapSegment
                        key={option.value}
                        option={option}
                        active={value === option.value}
                        disabled={disabled}
                        tone={tone}
                        size={size}
                        onActivate={() => onChange(option.value)}
                    />
                ),
            )}
        </div>
    );
}
