import {
    startFlood,
    startMist,
    stopCoolant,
} from 'app/features/Coolant/utils/actions';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { ArrowLeftRight, Wrench, Zap } from 'lucide-react';
import Select from 'react-select';
import { useCoolant } from '../../../hooks/useCoolant';
import SpindlePanel, { type SpindleCardApi } from '../../SpindlePanel';
import OverrideFaders from '../run/OverrideFaders';
import Segmented from './Segmented';

function PowerCard({ api }: { api: SpindleCardApi }) {
    const liveSpindle = useTypedSelector(
        (s: RootState) => (s.controller.state.status as any)?.spindle,
    );
    const laser = api.isLaserMode;
    const sValue = Number(liveSpindle) || api.spindleSpeed || 0;
    const readout = laser
        ? `S${Math.round(sValue)} · ${api.laserPower}%`
        : `S${Math.round(sValue)}`;
    const Icon = laser ? Zap : Wrench;

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
            <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-[7px] min-w-0">
                    <span
                        className={cn(
                            'w-6 h-6 shrink-0 rounded-sm border flex items-center justify-center',
                            laser
                                ? 'border-laser/50 bg-surface-elevated text-purple-300'
                                : 'border-outline-subtle bg-surface-elevated text-content-secondary',
                        )}
                    >
                        <Icon className="w-[13px] h-[13px]" />
                    </span>
                    <span
                        className={cn(
                            'text-[12.5px] font-bold',
                            laser ? 'text-purple-200' : 'text-content-primary',
                        )}
                    >
                        {laser ? 'Laser' : 'Spindle'}
                    </span>
                </div>
                <span
                    className={cn(
                        'shrink-0 font-mono text-[10.5px] font-semibold px-2 py-[3px] rounded-sm border bg-surface-elevated whitespace-nowrap',
                        laser
                            ? 'border-laser/40 text-purple-200'
                            : 'border-outline-subtle text-content-secondary',
                    )}
                >
                    {api.isConnected ? readout : '—'}
                </span>
            </div>

            <div className="flex items-center gap-[7px]">
                {api.spindleCount > 1 && (
                    <div className="flex-1 min-w-0">
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
                )}
                <button
                    type="button"
                    onClick={api.handleModeToggle}
                    disabled={!api.clickable}
                    aria-label={
                        laser ? 'Swap to spindle mode' : 'Swap to laser mode'
                    }
                    className={cn(
                        'shrink-0 h-7 flex items-center justify-center gap-1.5 rounded-sm border bg-surface-elevated disabled:opacity-40',
                        api.spindleCount > 1 ? 'w-7' : 'flex-1 px-2',
                        laser
                            ? 'border-laser/40 text-purple-200'
                            : 'border-outline-subtle text-content-muted',
                    )}
                >
                    <ArrowLeftRight className="w-[13px] h-[13px]" />
                    {api.spindleCount <= 1 && (
                        <span className="font-mono text-[8.5px] tracking-[0.03em] uppercase">
                            {laser ? 'Switch to spindle' : 'Switch to laser'}
                        </span>
                    )}
                </button>
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

    // M9 clears both, so turning one off re-sends the other if it was on
    const toggleMist = () => {
        if (!mistOn) return startMist();
        stopCoolant();
        if (floodOn) startFlood();
    };
    const toggleFlood = () => {
        if (!floodOn) return startFlood();
        stopCoolant();
        if (mistOn) startMist();
    };

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
