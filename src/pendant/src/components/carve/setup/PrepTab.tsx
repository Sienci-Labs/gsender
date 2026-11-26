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
import {
    Droplets,
    Lightbulb,
    LightbulbOff,
    RotateCcw,
    RotateCw,
    Settings2,
    Square,
    Waves,
    Wind,
    Wrench,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import { useCoolant } from '../../../hooks/useCoolant';
import { useHoldToActivate } from '../../../hooks/useHoldToActivate';
import SpindlePanel, { type SpindleCardApi } from '../../SpindlePanel';
import OverrideFaders from '../run/OverrideFaders';
import Segmented, {
    HoldSegment,
    type SegmentedOption,
    TapSegment,
} from './Segmented';
import './prepTab.css';

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
    const [pickerOpen, setPickerOpen] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const liveSpindle = useTypedSelector(
        (s: RootState) => (s.controller.state.status as any)?.spindle,
    );
    const laser = api.isLaserMode;
    const sTarget = Math.round(api.sTarget);
    const running = laser
        ? api.laserIsOn
        : api.spindleForward || api.spindleReverse;
    const liveS = Math.round(Number(liveSpindle) || 0);
    // Live S while running; otherwise what M3/M4 will send
    const sValue = running && liveS ? liveS : sTarget;
    const showTarget = running && liveS > 0 && liveS !== sTarget;
    const canPick = api.spindleCount > 1;

    // A tap anywhere outside the gear/picker closes it
    useEffect(() => {
        if (!pickerOpen) return;
        const onDown = (e: PointerEvent) => {
            if (!headerRef.current?.contains(e.target as Node))
                setPickerOpen(false);
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [pickerOpen]);

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
                'flex flex-col gap-2.5 px-2.5 py-2.5 rounded-md border',
                laser
                    ? 'border-laser/55 bg-laser/10'
                    : 'border-outline-subtle bg-surface-raised',
            )}
        >
            {/* Header: mode, selected spindle, spindle picker */}
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
                        <span className="text-[10px] text-content-muted truncate">
                            {api.spindleLabel}
                        </span>
                    </div>
                </div>
                {canPick && (
                    <button
                        type="button"
                        disabled={!api.clickable}
                        onClick={() => setPickerOpen((o) => !o)}
                        aria-expanded={pickerOpen}
                        aria-label="Select spindle"
                        className={cn(
                            'shrink-0 w-8 h-8 flex items-center justify-center rounded-md border bg-surface-elevated text-content-secondary disabled:opacity-40',
                            laser ? 'border-laser/40' : 'border-outline-subtle',
                            pickerOpen && 'ring-1 ring-robin-400/70',
                        )}
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                )}
                {/* Floats over the rows below rather than pushing them down */}
                {pickerOpen && canPick && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-20 flex flex-col gap-1.5 px-2.5 py-2 rounded-md border border-outline-strong bg-surface-elevated shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                        <span className="font-mono text-[9.5px] text-content-muted">
                            Spindle
                        </span>
                        <Select
                            options={api.spindleOptions}
                            value={api.selectedOption}
                            onChange={(opt: { value: string } | null) => {
                                if (!opt) return;
                                api.handleHALSpindleSelect(opt.value);
                                setPickerOpen(false);
                            }}
                            placeholder="Default Spindle"
                            isDisabled={!api.clickable}
                            styles={api.selectStyles as any}
                            isSearchable={false}
                        />
                    </div>
                )}
            </div>

            {/* Speed / power */}
            <div className="flex flex-col gap-1">
                <div className="flex items-end justify-between gap-2">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                        <span
                            className={cn(
                                'text-3xl font-bold leading-none tabular-nums',
                                laser
                                    ? 'text-purple-200'
                                    : running
                                      ? 'text-robin-400'
                                      : 'text-content-primary',
                            )}
                        >
                            {!api.isConnected
                                ? '—'
                                : laser
                                  ? Math.round(api.laserPower)
                                  : sValue.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-content-muted">
                            {laser ? '%' : 'RPM'}
                        </span>
                    </div>
                    {api.isConnected && (laser || showTarget) && (
                        <span className="font-mono text-[10px] text-content-muted tabular-nums whitespace-nowrap">
                            {laser ? `S${sValue}` : `target S${sTarget}`}
                        </span>
                    )}
                </div>
                <Slider
                    value={[Math.min(api.sMax, Math.max(api.sMin, sTarget))]}
                    min={api.sMin}
                    max={api.sMax}
                    step={api.sStep}
                    disabled={!api.clickable || api.sMax <= api.sMin}
                    onValueChange={([v]: number[]) => api.setSTarget(v)}
                    className="relative flex items-center w-full h-9 touch-none select-none"
                    trackClassName="h-3 bg-surface-sunken rounded-full relative flex-grow"
                    rangeClassName={cn(
                        'absolute h-full rounded-full',
                        laser ? 'bg-laser' : 'bg-robin-500',
                    )}
                    thumbClassName="block w-7 h-7 rounded-full border-2 border-outline-strong bg-white outline-none disabled:bg-gray-300"
                />
                <div className="flex justify-between font-mono text-[9px] text-content-disabled tabular-nums">
                    <span>{api.sMin}</span>
                    <span>{api.sMax}</span>
                </div>
            </div>

            <Segmented<Direction>
                size="lg"
                value={api.isConnected ? direction : null}
                onChange={onDirection}
                disabled={!api.clickable}
                tone={laser ? 'laser' : 'robin'}
                options={
                    // Starting is hold-to-confirm; Off stays an instant tap
                    laser
                        ? [
                              {
                                  value: 'on',
                                  label: 'On',
                                  icon: Lightbulb,
                                  hold: true,
                                  holdHint: 'Hold to turn laser on',
                              },
                              {
                                  value: 'off',
                                  label: 'Off',
                                  icon: LightbulbOff,
                                  danger: true,
                              },
                          ]
                        : [
                              {
                                  value: 'cw',
                                  label: 'CW',
                                  icon: RotateCw,
                                  hold: true,
                                  holdHint: 'Hold to start spindle CW',
                              },
                              {
                                  value: 'ccw',
                                  label: 'CCW',
                                  icon: RotateCcw,
                                  hold: true,
                                  holdHint: 'Hold to start spindle CCW',
                              },
                              {
                                  value: 'off',
                                  label: 'Stop',
                                  icon: Square,
                                  danger: true,
                              },
                          ]
                }
            />
        </div>
    );
}

/** Coolant toggle: turning on needs a hold, turning off is an instant tap
 * (same rule as spindle start vs. Stop). */
function CoolantButton({
    label,
    icon,
    on,
    disabled,
    onToggle,
}: {
    label: string;
    icon: SegmentedOption<string>['icon'];
    on: boolean;
    disabled: boolean;
    onToggle: () => void;
}) {
    const option = { value: label, label, icon };
    return on ? (
        <TapSegment
            option={option}
            active
            disabled={disabled}
            tone="robin"
            size="lg"
            onActivate={onToggle}
        />
    ) : (
        <HoldSegment
            option={option}
            hint={`Hold to turn on ${label.toLowerCase()}`}
            active={false}
            disabled={disabled}
            tone="robin"
            size="lg"
            onActivate={onToggle}
        />
    );
}

function CoolantRow({ laser }: { laser: boolean }) {
    const { isConnected, mistActive, floodActive, clickable } = useCoolant();
    const mistOn = isConnected && mistActive;
    const floodOn = isConnected && floodActive;
    const anyOn = mistOn || floodOn;

    // Turning either off sends M9, which stops both; the buttons follow the
    // modal state so both clear together
    const toggleMist = () => (mistOn ? stopCoolant() : startMist());
    const toggleFlood = () => (floodOn ? stopCoolant() : startFlood());

    return (
        <div className="flex flex-col gap-2 px-2.5 py-2.5 rounded-md border border-outline-subtle bg-surface-raised">
            <span className="text-[12.5px] font-bold leading-tight text-content-primary">
                {laser ? 'Air assist' : 'Coolant'}
            </span>
            <div className="flex gap-2">
                {laser ? (
                    <CoolantButton
                        label="Air"
                        icon={Wind}
                        on={mistOn}
                        disabled={!clickable}
                        onToggle={toggleMist}
                    />
                ) : (
                    <>
                        <CoolantButton
                            label="Mist"
                            icon={Droplets}
                            on={mistOn}
                            disabled={!clickable}
                            onToggle={toggleMist}
                        />
                        <CoolantButton
                            label="Flood"
                            icon={Waves}
                            on={floodOn}
                            disabled={!clickable}
                            onToggle={toggleFlood}
                        />
                    </>
                )}
                <TapSegment
                    option={{
                        value: 'off',
                        label: 'Off',
                        icon: Square,
                        danger: true,
                    }}
                    active={isConnected && !anyOn}
                    disabled={!clickable}
                    tone="robin"
                    size="lg"
                    onActivate={stopCoolant}
                />
            </div>
        </div>
    );
}

/** Power source, the Feed / Spindle overrides, then coolant (panels 05, 06).
 * The overrides grow into the spare space; see prepTab.css. */
export default function PrepTab() {
    const { coolantFunctions = false } = useWorkspaceState();
    const isLaserMode = useTypedSelector(
        (s: RootState) => Number(s.controller.settings.settings.$32 ?? 0) === 1,
    );

    return (
        <div className="prep-tab flex-1 min-h-0 overflow-auto">
            <div className="prep-layout px-2.5 py-[9px]">
                <div className="prep-power">
                    <SpindlePanel
                        mode="expanded"
                        renderCard={(api) => <PowerCard api={api} />}
                    />
                </div>
                <div className="prep-ovr">
                    <OverrideFaders />
                </div>
                {coolantFunctions && (
                    <div className="prep-coolant">
                        <CoolantRow laser={isLaserMode} />
                    </div>
                )}
            </div>
        </div>
    );
}
