import cn from 'classnames';
import { useEffect, useState } from 'react';
import { useClock } from '../../../hooks/useClock';
import type { CarveMode } from '../carveMode';
import { useAlarmHeadline } from './useAlarmHeadline';

// In alarm the slot mostly shows the alarm, with a short glance at the time
const ALARM_MS = 6000;
const TIME_MS = 2000;

export default function TopBarClock({ mode }: { mode: CarveMode }) {
    const time = useClock();
    const alarm = useAlarmHeadline(mode);
    const headline = alarm?.headline ?? null;
    const [showTime, setShowTime] = useState(false);

    useEffect(() => {
        setShowTime(false);
        if (!headline) return;
        let id: ReturnType<typeof setTimeout>;
        const cycle = (timeNext: boolean) => {
            id = setTimeout(
                () => {
                    setShowTime(timeNext);
                    cycle(!timeNext);
                },
                timeNext ? ALARM_MS : TIME_MS,
            );
        };
        cycle(true);
        return () => clearTimeout(id);
    }, [headline]);

    const alarmVisible = headline !== null && !showTime;

    return (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-1 place-items-center max-w-[40%] pointer-events-none">
            <span
                className={cn(
                    'col-start-1 row-start-1 font-mono text-xs font-semibold tracking-[0.03em] text-content-secondary tabular-nums transition-opacity duration-300',
                    alarmVisible ? 'opacity-0' : 'opacity-100',
                )}
            >
                {time}
            </span>
            {headline && (
                <span
                    role="status"
                    className={cn(
                        'col-start-1 row-start-1 max-w-full truncate text-[13px] font-bold text-state-alarm transition-opacity duration-300',
                        alarmVisible ? 'opacity-100' : 'opacity-0',
                    )}
                >
                    {headline}
                </span>
            )}
        </span>
    );
}
