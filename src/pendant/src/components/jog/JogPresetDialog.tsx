import {
    Dialog,
    DialogContent,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';
import { IMPERIAL_UNITS } from 'app/constants';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import cn from 'classnames';
import { Minus, Plus, Settings } from 'lucide-react';
import { useState } from 'react';
import {
    type JogConfig,
    type JogPresetId,
    PRESET_META,
    readJogPreset,
    saveJogPreset,
} from './jogShared';

type FieldKey = keyof JogConfig;

// −/+ step to the next of these "round" values, so a few taps cover the whole
// range; tap the number to type an exact value.
const LADDERS: Record<'mm' | 'in', Record<FieldKey, number[]>> = {
    mm: {
        xyStep: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100],
        zStep: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 20, 50],
        aStep: [0.1, 0.5, 1, 5, 10, 15, 30, 45, 90, 180],
        feedrate: [
            50, 100, 250, 500, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000,
        ],
    },
    in: {
        xyStep: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 4],
        zStep: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
        aStep: [0.1, 0.5, 1, 5, 10, 15, 30, 45, 90, 180],
        feedrate: [2, 5, 10, 20, 40, 60, 80, 120, 160, 200, 300, 400],
    },
};

const stepTo = (value: number, ladder: number[], direction: 1 | -1) => {
    if (direction > 0) {
        return ladder.find((v) => v > value + 1e-9) ?? value;
    }
    return [...ladder].reverse().find((v) => v < value - 1e-9) ?? value;
};

const parse = (text: string): number | null => {
    const value = Number(text.trim().replace(',', '.'));
    return Number.isFinite(value) && value > 0 ? value : null;
};

const format = (value: number) => String(Number(value.toFixed(4)));

function ValueRow({
    label,
    unit,
    text,
    onText,
    onStep,
}: {
    label: string;
    unit: string;
    text: string;
    onText: (text: string) => void;
    onStep: (direction: 1 | -1) => void;
}) {
    const invalid = parse(text) === null;
    const stepButton =
        'w-14 h-14 shrink-0 flex items-center justify-center rounded-xl border border-outline-subtle bg-surface-raised text-content-primary active:bg-robin-500 active:text-white active:border-robin-500 touch-manipulation select-none';

    return (
        <div className="flex items-center gap-2 min-w-0">
            <div className="w-[4.5rem] shrink-0 flex flex-col font-mono leading-tight">
                <span className="text-xs font-bold uppercase tracking-[0.04em] text-content-muted">
                    {label}
                </span>
                <span className="text-xs text-content-muted opacity-70">
                    {unit}
                </span>
            </div>
            <button
                type="button"
                aria-label={`Decrease ${label}`}
                className={stepButton}
                onClick={() => onStep(-1)}
            >
                <Minus className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <label
                className={cn(
                    'flex-1 min-w-0 h-14 flex items-center rounded-xl border-2 px-2 bg-surface-raised',
                    invalid
                        ? 'border-red-500'
                        : 'border-outline-subtle focus-within:border-robin-500',
                )}
            >
                <input
                    // size=1 drops the ~20ch intrinsic width that otherwise
                    // stops the row shrinking and pushes it out of the dialog.
                    size={1}
                    type="text"
                    inputMode="decimal"
                    aria-label={`${label} (${unit})`}
                    value={text}
                    onChange={(e) => onText(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 w-0 bg-transparent text-center font-mono text-xl font-bold text-content-primary outline-none"
                />
            </label>
            <button
                type="button"
                aria-label={`Increase ${label}`}
                className={stepButton}
                onClick={() => onStep(1)}
            >
                <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
        </div>
    );
}

function Editor({
    preset,
    onDone,
}: {
    preset: JogPresetId;
    onDone: () => void;
}) {
    const { units } = useWorkspaceState();
    const unitKey = units === IMPERIAL_UNITS ? 'in' : 'mm';
    const [texts, setTexts] = useState<Record<FieldKey, string>>(() => {
        const config = readJogPreset(preset, units ?? 'mm');
        return {
            xyStep: format(config.xyStep),
            zStep: format(config.zStep),
            aStep: format(config.aStep),
            feedrate: format(config.feedrate),
        };
    });

    const values = {
        xyStep: parse(texts.xyStep),
        zStep: parse(texts.zStep),
        aStep: parse(texts.aStep),
        feedrate: parse(texts.feedrate),
    };
    const canSave = Object.values(values).every((v) => v !== null);

    const setText = (key: FieldKey, text: string) =>
        setTexts((prev) => ({ ...prev, [key]: text }));
    const step = (key: FieldKey, direction: 1 | -1) => {
        const current = parse(texts[key]) ?? LADDERS[unitKey][key][0];
        setText(key, format(stepTo(current, LADDERS[unitKey][key], direction)));
    };

    const rows: { key: FieldKey; label: string; unit: string }[] = [
        { key: 'xyStep', label: 'XY step', unit: unitKey },
        { key: 'zStep', label: 'Z step', unit: unitKey },
        { key: 'aStep', label: 'A step', unit: 'deg' },
        { key: 'feedrate', label: 'Speed', unit: `${unitKey}/min` },
    ];

    const meta = PRESET_META.find((p) => p.id === preset);
    const Icon = meta?.icon;

    return (
        <>
            <DialogTitle className="flex items-center gap-2 pr-8 font-mono text-lg font-bold uppercase tracking-[0.04em] text-content-primary">
                {Icon && <Icon className="w-6 h-6 text-robin-500" />}
                {meta?.label ?? preset} jog preset
            </DialogTitle>
            <div className="flex flex-col gap-2.5 mt-2 min-w-0">
                {rows.map(({ key, label, unit }) => (
                    <ValueRow
                        key={key}
                        label={label}
                        unit={unit}
                        text={texts[key]}
                        onText={(text) => setText(key, text)}
                        onStep={(direction) => step(key, direction)}
                    />
                ))}
            </div>
            <div className="flex gap-3 mt-3 min-w-0">
                <button
                    type="button"
                    onClick={onDone}
                    className="flex-1 h-14 rounded-xl border border-outline-subtle bg-surface-raised font-mono text-sm font-bold uppercase tracking-[0.04em] text-content-muted touch-manipulation"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    disabled={!canSave}
                    onClick={() => {
                        if (!canSave) return;
                        saveJogPreset(
                            preset,
                            values as JogConfig,
                            units ?? 'mm',
                        );
                        onDone();
                    }}
                    className={cn(
                        'flex-1 h-14 rounded-xl font-mono text-sm font-bold uppercase tracking-[0.04em] touch-manipulation',
                        canSave
                            ? 'bg-robin-500 text-white'
                            : 'bg-surface-disabled text-content-disabled',
                    )}
                >
                    Save
                </button>
            </div>
        </>
    );
}

/**
 * Gear button that opens a touch-friendly editor for the selected jog
 * preset's step distances and speed. Saves to the shared preset setting
 * (the same one desktop Config > Jogging presets edits).
 */
export function JogPresetSettingsButton({
    preset,
    className,
    iconClassName = 'w-5 h-5',
}: {
    preset: JogPresetId;
    className?: string;
    iconClassName?: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                aria-label="Edit jog preset"
                onClick={() => setOpen(true)}
                className={className}
            >
                <Settings className={iconClassName} />
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-[min(94vw,560px)] max-w-none max-h-[calc(100dvh-1.5rem)] overflow-y-auto overflow-x-hidden grid-cols-[minmax(0,1fr)] p-4 rounded-2xl">
                    {/* Remount per open so it always starts from the saved values. */}
                    {open && (
                        <Editor preset={preset} onDone={() => setOpen(false)} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
