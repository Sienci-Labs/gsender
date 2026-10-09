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
import { CORNERS, HoldCorner, useCornerRapid } from '../../move/cornerRapid';
import ProbePanel from '../../ProbePanel';
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
    const wpos = useTypedSelector((s: RootState) => s.controller.wpos);
    const hasHomed = useTypedSelector((s: RootState) => s.controller.hasHomed);
    // Same gate as MovePanel's Corner Select: canAct && hasHomed
    const canCorner = canGoTo && hasHomed;
    const { selectedCorner, handleConfirmCorner } = useCornerRapid(canCorner);
    const pos = isConnected ? wpos : { x: 0, y: 0, z: 0, a: 0 };

    return (
        <>
            {AXES.map(({ label, border, text }) => (
                <div
                    key={label}
                    className={cn(
                        'flex items-center justify-between px-[9px] py-[7px] rounded-md bg-surface-raised border-l-[3px]',
                        border,
                    )}
                >
                    <button
                        type="button"
                        onClick={() => gotoZero(label)}
                        disabled={!canGoTo}
                        aria-label={`Go to ${label} 0`}
                        className={cn(
                            'flex items-center gap-1 px-[7px] py-1 rounded-sm border border-outline-subtle bg-surface-sunken font-mono text-[11.5px] font-semibold disabled:opacity-40',
                            text,
                        )}
                    >
                        <span>{label}</span>
                        <ArrowRight
                            className="w-[9px] h-[9px]"
                            strokeWidth={2.5}
                        />
                    </button>
                    <span className="font-mono text-xs text-content-secondary tabular-nums">
                        {formatAxisValue(
                            pos?.[label.toLowerCase() as 'x' | 'y' | 'z' | 'a'],
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={() => zeroWCS(label, 0)}
                        disabled={!canZero}
                        className="font-mono text-[9px] tracking-[0.05em] px-[7px] py-[3px] rounded-md border border-outline-strong text-content-secondary disabled:opacity-40"
                    >
                        ZERO
                    </button>
                </div>
            ))}

            <div className="flex gap-[7px] mt-px">
                <button
                    type="button"
                    onClick={goXYAxes}
                    disabled={!canGoTo}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border border-outline-strong font-mono text-[10px] font-bold tracking-[0.04em] uppercase text-content-secondary disabled:opacity-40"
                >
                    <MoveUpRight className="w-3 h-3" />
                    Go To XY
                </button>
                <button
                    type="button"
                    onClick={zeroAllAxes}
                    disabled={!canZero}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border border-transparent bg-blue-600 font-mono text-[10px] font-bold tracking-[0.04em] uppercase text-white disabled:opacity-40"
                >
                    <Crosshair className="w-3 h-3" />
                    Zero All
                </button>
            </div>

            <div className="mt-0.5 p-[9px] flex flex-col gap-[7px] rounded-lg border border-outline-subtle bg-surface-raised">
                <p className="m-0 font-mono text-[9px] tracking-[0.08em] uppercase text-content-disabled">
                    Rapid to corner
                </p>
                {/* Inset so the corner targets, centred on the pad's corners,
                    stay inside the card */}
                <div className="px-4 py-4">
                    <div className="relative h-20 rounded-md border-[1.5px] border-dashed border-outline-strong bg-surface-sunken">
                        {CORNERS.map((corner) => (
                            <HoldCorner
                                key={corner.id}
                                corner={corner}
                                selected={selectedCorner === corner.id}
                                disabled={!canCorner}
                                onConfirm={handleConfirmCorner}
                                size={corner.size > 60 ? 32 : 28}
                            />
                        ))}
                    </div>
                </div>
                <p className="m-0 text-[9.5px] text-content-disabled">
                    Hold a corner to rapid there, home required first
                </p>
            </div>
        </>
    );
}

export default function PositionTab() {
    const [method, setMethod] = useState<'manual' | 'probe'>('manual');

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
            {/* Both stay mounted so a probe wizard survives a switch */}
            <div
                className={
                    method === 'manual' ? 'flex flex-col gap-[7px]' : 'hidden'
                }
            >
                <ManualZero />
            </div>
            <div
                className={
                    method === 'probe'
                        ? 'flex flex-col flex-1 min-h-0'
                        : 'hidden'
                }
            >
                <ProbePanel mode="expanded" />
            </div>
        </div>
    );
}
