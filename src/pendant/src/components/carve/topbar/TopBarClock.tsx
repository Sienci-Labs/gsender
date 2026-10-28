import cn from 'classnames';
import {
    BatteryFull,
    BatteryLow,
    BatteryMedium,
    BatteryWarning,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useBattery } from '../../../hooks/useBattery';
import { useClock } from '../../../hooks/useClock';
import type { CarveMode } from '../carveMode';
import { useAlarmHeadline } from './useAlarmHeadline';

type Slot = 'alarm' | 'time' | 'battery';

// In alarm the slot mostly shows the alarm, with short glances at the time
// (and battery). Otherwise the time leads and the battery gets a glance.
const ALARM_MS = 6000;
const GLANCE_MS = 2000;
const TIME_MS = 6000;
const BATTERY_MS = 3000;
/** At or below this the battery reading turns to the warning colour. */
const LOW_BATTERY_PERCENT = 20;

function BatteryIcon({ percent }: { percent: number }) {
    const Icon =
        percent <= LOW_BATTERY_PERCENT
            ? BatteryWarning
            : percent <= 40
              ? BatteryLow
              : percent <= 75
                ? BatteryMedium
                : BatteryFull;
    return <Icon className="w-4 h-4" aria-hidden />;
}

export default function TopBarClock({ mode }: { mode: CarveMode }) {
    const time = useClock();
    const alarm = useAlarmHeadline(mode);
    const headline = alarm?.headline ?? null;
    const battery = useBattery();
    // Only worth a glance while running on battery
    const showBattery = battery !== null && !battery.charging;

    const slots = useMemo<{ slot: Slot; ms: number }[]>(() => {
        const list: { slot: Slot; ms: number }[] = [];
        if (headline) list.push({ slot: 'alarm', ms: ALARM_MS });
        list.push({ slot: 'time', ms: headline ? GLANCE_MS : TIME_MS });
        if (showBattery) {
            list.push({ slot: 'battery', ms: headline ? GLANCE_MS : BATTERY_MS });
        }
        return list;
    }, [headline, showBattery]);

    const [index, setIndex] = useState(0);

    // Restarts the rotation (alarm first, if any) whenever the set of slots
    // changes - not on every battery percent or clock tick.
    useEffect(() => {
        setIndex(0);
        if (slots.length < 2) return undefined;
        let current = 0;
        let id: ReturnType<typeof setTimeout>;
        const schedule = () => {
            id = setTimeout(() => {
                current = (current + 1) % slots.length;
                setIndex(current);
                schedule();
            }, slots[current].ms);
        };
        schedule();
        return () => clearTimeout(id);
    }, [slots]);

    const visible = slots[Math.min(index, slots.length - 1)].slot;
    const lowBattery =
        battery !== null && battery.percent <= LOW_BATTERY_PERCENT;

    return (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-1 place-items-center max-w-[40%] pointer-events-none">
            <span
                className={cn(
                    'col-start-1 row-start-1 font-mono text-xs font-semibold tracking-[0.03em] text-content-secondary tabular-nums transition-opacity duration-300',
                    visible === 'time' ? 'opacity-100' : 'opacity-0',
                )}
            >
                {time}
            </span>
            {showBattery && (
                <span
                    aria-label={`Battery ${battery.percent}%`}
                    className={cn(
                        'col-start-1 row-start-1 flex items-center gap-1 font-mono text-xs font-semibold tabular-nums transition-opacity duration-300',
                        lowBattery ? 'text-state-alarm' : 'text-content-secondary',
                        visible === 'battery' ? 'opacity-100' : 'opacity-0',
                    )}
                >
                    <BatteryIcon percent={battery.percent} />
                    {battery.percent}%
                </span>
            )}
            {headline && (
                <span
                    role="status"
                    className={cn(
                        'col-start-1 row-start-1 max-w-full truncate text-[13px] font-bold text-state-alarm transition-opacity duration-300',
                        visible === 'alarm' ? 'opacity-100' : 'opacity-0',
                    )}
                >
                    {headline}
                </span>
            )}
        </span>
    );
}
