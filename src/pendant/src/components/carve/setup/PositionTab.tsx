import {
    gotoZero,
    goXYAxes,
    zeroAllAxes,
    zeroWCS,
} from 'app/features/DRO/utils/DRO';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { ArrowRight, Crosshair, MoveUpRight } from 'lucide-react';
import { useState } from 'react';
import { useDroGating } from '../../../hooks/useDroGating';
import ProbePanel from '../../ProbePanel';
import HoldButton from './HoldButton';
import Segmented from './Segmented';

const AXES = [
    { label: 'X', border: 'border-l-axis-x', text: 'text-axis-x' },
    { label: 'Y', border: 'border-l-axis-y', text: 'text-axis-y' },
    { label: 'Z', border: 'border-l-axis-z', text: 'text-axis-z' },
    { label: 'A', border: 'border-l-axis-a', text: 'text-axis-a' },
] as const;

function formatAxisValue(value: unknown): string {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed)
        ? parsed.toFixed(3).replace('-', '−')
        : '0.000';
}

function ManualZero() {
    const { isConnected, canZero, canGoTo } = useDroGating();
    const [coords, setCoords] = useState<'work' | 'machine'>('work');
    const wpos = useTypedSelector((s: RootState) => s.controller.wpos);
    const mpos = useTypedSelector((s: RootState) => s.controller.mpos);
    const pos = !isConnected
        ? { x: 0, y: 0, z: 0, a: 0 }
        : coords === 'machine'
          ? mpos
          : wpos;

    return (
        <>
            <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-content-disabled">
                    {coords === 'machine' ? 'Machine position' : 'Work position'}
                </span>
                <div className="flex gap-0.5 p-0.5 rounded-md border border-outline-subtle bg-surface-raised">
                    {(['work', 'machine'] as const).map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCoords(c)}
                            aria-pressed={coords === c}
                            className={cn(
                                'px-3.5 py-2 rounded-sm font-mono text-[11px] tracking-[0.04em] uppercase transition-colors',
                                coords === c
                                    ? 'bg-robin-600/20 text-robin-400'
                                    : 'text-content-disabled',
                            )}
                        >
                            {c === 'work' ? 'Work' : 'Machine'}
                        </button>
                    ))}
                </div>
            </div>

            {AXES.map(({ label, border, text }) => (
                <div
                    key={label}
                    className={cn(
                        // Rows share the tab's free height
                        'flex flex-1 min-h-[60px] items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-surface-raised border-l-[3px]',
                        border,
                    )}
                >
                    <HoldButton
                        onActivate={() => gotoZero(label)}
                        disabled={!canGoTo}
                        aria-label={`Hold to go to ${label} 0`}
                        className={cn(
                            'gap-1.5 h-[80%] min-h-12 min-w-[64px] px-3.5 rounded-md border border-outline-subtle bg-surface-sunken font-mono text-[15px] font-semibold disabled:opacity-40',
                            text,
                        )}
                    >
                        <span>{label}</span>
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </HoldButton>
                    <span
                        className={cn(
                            'font-mono text-[26px] font-semibold tabular-nums leading-none',
                            text,
                        )}
                    >
                        {formatAxisValue(
                            pos?.[label.toLowerCase() as 'x' | 'y' | 'z' | 'a'],
                        )}
                    </span>
                    <HoldButton
                        onActivate={() => zeroWCS(label, 0)}
                        disabled={!canZero}
                        aria-label={`Hold to zero ${label}`}
                        className="h-[80%] min-h-12 min-w-[72px] px-3.5 rounded-md border border-outline-strong font-mono text-[13px] tracking-[0.05em] text-content-secondary disabled:opacity-40"
                    >
                        ZERO
                    </HoldButton>
                </div>
            ))}

            <div className="flex gap-2 shrink-0">
                <HoldButton
                    onActivate={goXYAxes}
                    disabled={!canGoTo}
                    aria-label="Hold to go to XY 0"
                    className="flex-1 gap-2 h-14 rounded-md border border-outline-strong font-mono text-[13px] font-bold tracking-[0.04em] uppercase text-content-secondary disabled:opacity-40"
                >
                    <MoveUpRight className="w-[18px] h-[18px]" />
                    Go To XY
                </HoldButton>
                <HoldButton
                    onActivate={zeroAllAxes}
                    disabled={!canZero}
                    aria-label="Hold to zero all axes"
                    fillClassName="bg-white/30"
                    holdingClassName="ring-1 ring-white/60"
                    className="flex-1 gap-2 h-14 rounded-md border border-transparent bg-blue-600 font-mono text-[13px] font-bold tracking-[0.04em] uppercase text-white disabled:opacity-40"
                >
                    <Crosshair className="w-[18px] h-[18px]" />
                    Zero All
                </HoldButton>
            </div>
        </>
    );
}

export default function PositionTab() {
    const [method, setMethod] = useState<'manual' | 'probe'>('manual');
    const [probeMode, setProbeMode] = useState<'minimal' | 'expanded'>(
        'minimal',
    );

    return (
        <div className="flex flex-col flex-1 min-h-0 gap-[7px] px-2.5 py-[9px] overflow-auto">
            <Segmented
                value={method}
                onChange={setMethod}
                options={[
                    { value: 'manual', label: 'Manual' },
                    { value: 'probe', label: 'Probe' },
                ]}
            />
            {/* Both stay mounted so a probe wizard survives a switch. The
                probe side keeps a usable height on short screens and the
                tab scrolls instead */}
            <div
                className={
                    method === 'manual'
                        ? 'flex flex-col flex-1 gap-2'
                        : 'hidden'
                }
            >
                <ManualZero />
            </div>
            <div
                className={
                    method === 'probe'
                        ? 'flex flex-col flex-1 min-w-0 min-h-[360px]'
                        : 'hidden'
                }
            >
                <ProbePanel mode={probeMode} onModeChange={setProbeMode} />
            </div>
        </div>
    );
}
