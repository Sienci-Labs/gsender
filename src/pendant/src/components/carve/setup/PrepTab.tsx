import { Slider } from 'app/components/shadcn/Slider';
import {
    startFlood,
    startMist,
    stopCoolant,
} from 'app/features/Coolant/utils/actions';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { ChevronDown, Wrench, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import { useCoolant } from '../../../hooks/useCoolant';
import { useHoldToActivate } from '../../../hooks/useHoldToActivate';
import SpindlePanel, { type SpindleCardApi } from '../../SpindlePanel';
import OverrideFaders from '../run/OverrideFaders';
import Segmented from './Segmented';

const RING_R = 15;
const RING_C = 2 * Math.PI * RING_R;

/** The mode icon doubles as the laser/spindle swap: a full 1 s hold swaps,
 * with a ring closing around the icon as the hold progresses. */
function ModeSwapIcon({ api }: { api: SpindleCardApi }) {
    const laser = api.isLaserMode;
    const Icon = laser ? Zap : Wrench;
    const { progress, showProgress, hintNode, bind } = useHoldToActivate(
        api.handleModeToggle,
        {
            disabled: !api.clickable,
            hint: laser ? 'Hold to swap to spindle' : 'Hold to swap to laser',
        },
    );

    return (
        <button
            type="button"
            disabled={!api.clickable}
            aria-label={
                laser ? 'Hold to swap to spindle' : 'Hold to swap to laser'
            }
            {...bind}
            className={cn(
                'relative w-8 h-8 shrink-0 rounded-md border flex items-center justify-center select-none touch-none disabled:opacity-50',
                laser
                    ? 'border-laser/50 bg-surface-elevated text-purple-300'
                    : 'border-outline-subtle bg-surface-elevated text-content-secondary',
            )}
        >
            <Icon className="w-4 h-4" />
            <svg
                aria-hidden
                width="34"
                height="34"
                viewBox="0 0 34 34"
                className="absolute -inset-px -rotate-90 pointer-events-none"
            >
                <circle
                    cx="17"
                    cy="17"
                    r={RING_R}
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className={laser ? 'stroke-purple-300' : 'stroke-robin-400'}
                    strokeDasharray={RING_C}
                    strokeDashoffset={RING_C * (1 - progress)}
                    opacity={showProgress ? 1 : 0}
                />
            </svg>
            {hintNode}
        </button>
    );
}

function PowerCard({ api }: { api: SpindleCardApi }) {
    const [sliderOpen, setSliderOpen] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const liveSpindle = useTypedSelector(
        (s: RootState) => (s.controller.state.status as any)?.spindle,
    );
    const laser = api.isLaserMode;
    const sTarget = Math.round(api.sTarget);
    // Live S while running; otherwise what M3/M4 will send
    const sValue = Math.round(Number(liveSpindle) || sTarget || 0);
    const readout = laser
        ? `S${sValue} · ${Math.round(api.laserPower)}%`
        : `S${sValue}`;

    // A tap anywhere outside the chip/overlay closes it
    useEffect(() => {
        if (!sliderOpen) return;
        const onDown = (e: PointerEvent) => {
            if (!headerRef.current?.contains(e.target as Node))
                setSliderOpen(false);
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [sliderOpen]);

    type Direction = 'cw' | 'ccw' | 'on' | 'off';
    const direction: Direction = laser
        ? api.laserIsOn
            ? 'on'
            : 'off'
        : api.spindleForward
          ? 'cw'
          : api.spindleReverse
            ? 'ccw'
            : 'off';

    const onDirection = (d: Direction) => {
        if (d === 'cw') api.sendM3();
        else if (d === 'ccw') api.sendM4();
        else if (d === 'on') api.sendLaserM3();
        else api.sendM5();
    };

    return (
        <div
            className={cn(
                'flex flex-col gap-[7px] px-2.5 py-2 rounded-md border',
                laser
                    ? 'border-laser/55 bg-laser/10'
                    : 'border-outline-subtle bg-surface-raised',
            )}
        >
            <div
                ref={headerRef}
                className="relative flex items-center justify-between gap-1.5"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <ModeSwapIcon api={api} />
                    <div className="flex flex-col min-w-0">
                        <span
                            className={cn(
                                'text-[12.5px] font-bold leading-tight',
                                laser
                                    ? 'text-purple-200'
                                    : 'text-content-primary',
                            )}
                        >
                            {laser ? 'Laser' : 'Spindle'}
                        </span>
                        <span className="font-mono text-[8.5px] text-content-disabled truncate">
                            Hold icon to swap to {laser ? 'spindle' : 'laser'}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    disabled={!api.isConnected}
                    onClick={() => setSliderOpen((o) => !o)}
                    aria-expanded={sliderOpen}
                    aria-label={laser ? 'Set laser power' : 'Set spindle speed'}
                    className={cn(
                        'shrink-0 flex items-center gap-1 font-mono text-[10.5px] font-semibold px-2 h-7 rounded-sm border bg-surface-elevated whitespace-nowrap',
                        laser
                            ? 'border-laser/40 text-purple-200'
                            : 'border-outline-subtle text-content-secondary',
                        sliderOpen && 'ring-1 ring-robin-400/70',
                    )}
                >
                    {api.isConnected ? readout : '—'}
                    <ChevronDown
                        className={cn(
                            'w-3 h-3 transition-transform',
                            sliderOpen && 'rotate-180',
                        )}
                    />
                </button>
                {/* Floats over the rows below rather than pushing them down */}
                {sliderOpen && api.isConnected && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-20 flex flex-col gap-1 px-2.5 py-2 rounded-md border border-outline-strong bg-surface-elevated shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between font-mono text-[9.5px] text-content-muted">
                            <span>{laser ? 'Power' : 'Speed'} (S)</span>
                            <span
                                className={cn(
                                    'text-[11px] font-semibold tabular-nums',
                                    laser
                                        ? 'text-purple-200'
                                        : 'text-content-primary',
                                )}
                            >
                                S{sTarget}
                            </span>
                        </div>
                        <Slider
                            value={[
                                Math.min(api.sMax, Math.max(api.sMin, sTarget)),
                            ]}
                            min={api.sMin}
                            max={api.sMax}
                            step={api.sStep}
                            disabled={!api.clickable || api.sMax <= api.sMin}
                            onValueChange={([v]: number[]) => api.setSTarget(v)}
                            className="relative flex items-center w-full h-8 touch-none select-none"
                            trackClassName="h-2 bg-surface-sunken rounded-full relative flex-grow"
                            rangeClassName={cn(
                                'absolute h-full rounded-full',
                                laser ? 'bg-laser' : 'bg-robin-500',
                            )}
                            thumbClassName="block w-6 h-6 rounded-full border-2 border-outline-strong bg-white outline-none disabled:bg-gray-300"
                        />
                        <div className="flex justify-between font-mono text-[9px] text-content-disabled tabular-nums">
                            <span>{api.sMin}</span>
                            <span>{api.sMax}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="min-w-0">
                <Select
                    options={api.spindleOptions}
                    value={api.selectedOption}
                    onChange={(opt: { value: string } | null) =>
                        opt && api.handleHALSpindleSelect(opt.value)
                    }
                    placeholder="Default Spindle"
                    isDisabled={!api.hasSpindles || !api.clickable}
                    styles={api.selectStyles as any}
                    isSearchable={false}
                />
            </div>

            <Segmented<Direction>
                value={api.isConnected ? direction : null}
                onChange={onDirection}
                disabled={!api.clickable}
                tone={laser ? 'laser' : 'robin'}
                options={
                    laser
                        ? [
                              { value: 'on', label: 'On' },
                              { value: 'off', label: 'Off' },
                          ]
                        : [
                              { value: 'cw', label: 'CW' },
                              { value: 'ccw', label: 'CCW' },
                              { value: 'off', label: 'Off' },
                          ]
                }
            />
        </div>
    );
}

function Chip({
    label,
    on,
    disabled,
    onClick,
}: {
    label: string;
    on: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'shrink-0 font-mono text-[8.5px] tracking-[0.03em] uppercase px-[9px] py-[5px] rounded-sm border disabled:opacity-40',
                on
                    ? 'bg-robin-600/20 text-robin-400 border-robin-500'
                    : 'bg-surface-elevated text-content-muted border-outline-subtle',
            )}
        >
            {label}
        </button>
    );
}

function CoolantRow({ laser }: { laser: boolean }) {
    const { isConnected, mistActive, floodActive, clickable } = useCoolant();
    const mistOn = isConnected && mistActive;
    const floodOn = isConnected && floodActive;

    // Turning either off sends M9, which stops both; the chips follow the
    // modal state so both clear together
    const toggleMist = () => (mistOn ? stopCoolant() : startMist());
    const toggleFlood = () => (floodOn ? stopCoolant() : startFlood());

    return (
        <div className="flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md bg-surface-raised">
            <span className="text-[11.5px] font-semibold text-content-primary">
                Coolant
            </span>
            <div className="flex gap-1.5">
                {laser ? (
                    <Chip
                        label="Air assist"
                        on={mistOn}
                        disabled={!clickable}
                        onClick={toggleMist}
                    />
                ) : (
                    <>
                        <Chip
                            label="Mist"
                            on={mistOn}
                            disabled={!clickable}
                            onClick={toggleMist}
                        />
                        <Chip
                            label="Flood"
                            on={floodOn}
                            disabled={!clickable}
                            onClick={toggleFlood}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

/** Power source, coolant and the Feed / Spindle overrides (panels 05, 06). */
export default function PrepTab() {
    const { coolantFunctions = false } = useWorkspaceState();
    const isLaserMode = useTypedSelector(
        (s: RootState) => Number(s.controller.settings.settings.$32 ?? 0) === 1,
    );

    return (
        <div className="flex flex-col flex-1 min-h-0 gap-[7px] px-2.5 py-[9px] overflow-auto">
            <SpindlePanel
                mode="expanded"
                renderCard={(api) => <PowerCard api={api} />}
            />
            {coolantFunctions && <CoolantRow laser={isLaserMode} />}
            <p className="m-0 mt-0.5 mb-px font-mono text-[9.5px] tracking-[0.08em] uppercase text-content-disabled">
                Overrides
            </p>
            <OverrideFaders fill={false} />
        </div>
    );
}
