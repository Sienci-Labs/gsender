import { useEffect, useState } from 'react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { METRIC_UNITS } from 'app/constants';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { mapPositionToUnits } from 'app/lib/units';

function Clock() {
    const [time, setTime] = useState(() =>
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    );
    useEffect(() => {
        const id = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
        }, 1000);
        return () => clearInterval(id);
    }, []);
    return <span>{time}</span>;
}

function formatReadout(value: unknown): string {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '0';
    const rounded = Math.round(parsed * 100) / 100;
    return Number.isInteger(rounded)
        ? String(rounded)
        : String(rounded).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
}

export default function InfoStrip() {
    const status = useTypedSelector((state: RootState) => state.controller.state.status) as any;
    const { units } = useWorkspaceState();

    let feedrate = status?.feedrate ?? '0';
    const spindle = status?.spindle ?? '0';
    if (units !== METRIC_UNITS) {
        feedrate = mapPositionToUnits(feedrate, units);
    }
    const feedLabel = formatReadout(feedrate);
    const spindleLabel = formatReadout(spindle);

    return (
        <div className="relative z-40 flex items-center gap-3 px-3 md:px-4 py-1.5 bg-white border-b border-gray-200 dark:bg-dark dark:border-dark-lighter shrink-0 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span className="whitespace-nowrap">
                Feed <strong className="inline-block w-[5ch] text-right tabular-nums text-gray-900 dark:text-white font-mono">{feedLabel}</strong> {units}/min
            </span>
            <span className="whitespace-nowrap">
                Spindle <strong className="inline-block w-[5ch] text-right tabular-nums text-gray-900 dark:text-white font-mono">{spindleLabel}</strong> RPM
            </span>
            <div className="flex-1" />
            <span className="font-mono text-gray-400 dark:text-gray-500">
                <Clock />
            </span>
        </div>
    );
}
