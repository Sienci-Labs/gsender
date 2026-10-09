import { OVERRIDE_VALUE_RANGES } from 'app/constants';
import { RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import { useHoldToActivate } from '../../../hooks/useHoldToActivate';
import './isoFader.css';

export type FaderKind = 'feed' | 'spindle' | 'laser';

const MIN = OVERRIDE_VALUE_RANGES.MIN;
const MAX = OVERRIDE_VALUE_RANGES.MAX;
const STEP = 10;
// Matches .ovr-thumb-wrap's top/bottom inset
const TRACK_INSET = 11;
const SEGMENTS = 11;

const clampStep = (v: number) =>
    Math.min(MAX, Math.max(MIN, Math.round(v / STEP) * STEP));

const toFraction = (v: number) => (clampStep(v) - MIN) / (MAX - MIN);

interface IsoFaderProps {
    kind: FaderKind;
    chip: string;
    title: string;
    value: number;
    sub: string;
    disabled: boolean;
    /** Local update while the cap is moving. */
    onPreview: (value: number) => void;
    /** Final value on release, tap or Reset. */
    onCommit: (value: number) => void;
}

/** A vertical override fader; pointer events only so touch and mouse both
 * drive it. Tapping the track jumps the cap there. */
export default function IsoFader({
    kind,
    chip,
    title,
    value,
    sub,
    disabled,
    onPreview,
    onCommit,
}: IsoFaderProps) {
    const zoneRef = useRef<HTMLDivElement>(null);
    const [dragValue, setDragValue] = useState<number | null>(null);
    // Mirrors dragValue synchronously so pointerup + lostpointercapture
    // can't both commit
    const dragRef = useRef<number | null>(null);
    // The cap snaps to the 10% grid; the readout shows the real override
    const shown = dragValue ?? Math.round(Number(value) || 100);
    const fraction = toFraction(shown);
    const currentSeg = Math.round(fraction * (SEGMENTS - 1));
    // Reset needs a full 1 s hold so a stray tap can't snap a running job
    const reset = useHoldToActivate(() => onCommit(100), {
        disabled,
        hint: 'Hold to reset',
    });

    const valueAt = (clientY: number) => {
        const rect = zoneRef.current?.getBoundingClientRect();
        if (!rect) return shown;
        const span = rect.height - TRACK_INSET * 2;
        const fromBottom = rect.bottom - TRACK_INSET - clientY;
        const f = Math.min(1, Math.max(0, fromBottom / span));
        return clampStep(MIN + f * (MAX - MIN));
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const v = valueAt(e.clientY);
        dragRef.current = v;
        setDragValue(v);
        onPreview(v);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current === null) return;
        const v = valueAt(e.clientY);
        if (v !== dragRef.current) {
            dragRef.current = v;
            setDragValue(v);
            onPreview(v);
        }
    };

    const endDrag = () => {
        const v = dragRef.current;
        if (v === null) return;
        dragRef.current = null;
        onCommit(v);
        setDragValue(null);
    };

    return (
        <div className={`ovr-card${disabled ? ' is-disabled' : ''}`}>
            <div className="ovr-head">
                <span className={`ovr-chip ${kind}`}>{chip}</span>
                <div className="ovr-head-text">
                    <span className="ovr-title">{title}</span>
                    <span className="ovr-range">
                        {MIN}-{MAX}%
                    </span>
                </div>
            </div>

            <div
                ref={zoneRef}
                className="ovr-zone"
                role="slider"
                aria-label={`${title} override`}
                aria-valuemin={MIN}
                aria-valuemax={MAX}
                aria-valuenow={shown}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onLostPointerCapture={endDrag}
                onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        onCommit(clampStep(shown + STEP));
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        onCommit(clampStep(shown - STEP));
                    }
                }}
            >
                <div className="ovr-segs">
                    <div className="ovr-segs-inner">
                        {Array.from({ length: SEGMENTS }, (_, i) => (
                            <div
                                key={i}
                                className={`ovr-seg ${kind} ${
                                    i === currentSeg
                                        ? 'current'
                                        : i < currentSeg
                                          ? 'filled'
                                          : 'dim'
                                }`}
                                style={{
                                    bottom: `${(i / (SEGMENTS - 1)) * 100}%`,
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div className="ovr-channel">
                    <div className="ovr-centerline" />
                    <div className="ovr-thumb-wrap">
                        <div
                            className="ovr-thumb"
                            style={{ bottom: `${fraction * 100}%` }}
                        >
                            <span className="ovr-grip" />
                            <span className={`ovr-grip accent ${kind}`} />
                            <span className="ovr-grip" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="ovr-readout">
                <span className={`ovr-big ${kind}`}>{shown}%</span>
                <span className="ovr-sub">{sub}</span>
            </div>
            <button
                className={`ovr-reset${reset.holding ? ' is-holding' : ''}`}
                type="button"
                disabled={disabled}
                aria-label={`Hold to reset ${title.toLowerCase()} override`}
                {...reset.bind}
            >
                <span
                    aria-hidden
                    className={`ovr-reset-fill ${kind}`}
                    style={{ width: `${reset.progress * 100}%` }}
                />
                <RotateCcw className="w-[12px] h-[12px]" aria-hidden />
                <span>Reset</span>
                {reset.hintNode}
            </button>
        </div>
    );
}
