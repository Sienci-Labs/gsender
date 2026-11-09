import cn from 'classnames';

/** Small segmented toggle (Manual / Probe, CW / CCW / Off). */
export default function Segmented<T extends string>({
    value,
    onChange,
    options,
    disabled,
    tone = 'robin',
}: {
    value: T | null;
    onChange: (value: T) => void;
    options: { value: T; label: string }[];
    disabled?: boolean;
    tone?: 'robin' | 'laser';
}) {
    return (
        <div
            className={cn(
                'flex gap-1 p-[3px] rounded-md border bg-surface-raised',
                tone === 'laser' ? 'border-laser/40' : 'border-outline-subtle',
            )}
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'flex-1 py-1.5 rounded-sm font-mono text-[9.5px] tracking-[0.04em] uppercase transition-colors disabled:opacity-40',
                        value === option.value
                            ? tone === 'laser'
                                ? 'bg-laser/25 text-purple-200'
                                : 'bg-robin-600/20 text-robin-400'
                            : 'text-content-disabled',
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
