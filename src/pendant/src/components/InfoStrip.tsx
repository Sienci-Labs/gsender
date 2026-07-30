import { useEffect, useState } from 'react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { GRBLHAL, METRIC_UNITS } from 'app/constants';
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
    const controllerType = useTypedSelector((state: RootState) => state.controller.type);
    const currentTool = useTypedSelector((state: RootState) => (state.controller.state.status as any)?.currentTool);
    const isLaserMode = useTypedSelector((state: RootState) =>
        Number(state.controller.settings.settings.$32 ?? 0) === 1,
    );
    const spindleModal = useTypedSelector((state: RootState) =>
        state.controller.modal.spindle ?? 'M5',
    );
    const spindleActive = spindleModal !== 'M5';
    const { units } = useWorkspaceState();
    const showTool = controllerType === GRBLHAL && currentTool != null && Number(currentTool) >= 0;

    let feedrate = status?.feedrate ?? '0';
    const spindle = status?.spindle ?? '0';
    if (units !== METRIC_UNITS) {
        feedrate = mapPositionToUnits(feedrate, units);
    }
    const feedLabel = formatReadout(feedrate);
    const spindleLabel = formatReadout(spindle);

    return (
        <div className="relative z-40 flex items-center gap-3 px-3 md:px-4 py-1.5 bg-white border-b border-gray-200 dark:bg-dark dark:border-dark-lighter shrink-0 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center rounded-md border border-gray-200 dark:border-dark-lighter overflow-hidden bg-gray-50/70 dark:bg-dark-darker/60">
                <span className="whitespace-nowrap px-2.5 py-1">
                    Feed <strong className="inline-block w-[5ch] text-right tabular-nums text-gray-900 dark:text-white font-mono">{feedLabel}</strong> {units}/min
                </span>
                <span className="h-5 w-px bg-gray-200 dark:bg-dark-lighter" />
                <span className="whitespace-nowrap px-2.5 py-1">
                    <span className={spindleActive ? (isLaserMode ? 'text-purple-500 animate-pulse' : 'text-red-500 animate-pulse') : ''}>
                        {isLaserMode ? 'Laser' : 'Spindle'}
                    </span>{' '}<strong className="inline-block w-[5ch] text-right tabular-nums text-gray-900 dark:text-white font-mono">{spindleLabel}</strong> {isLaserMode ? 'POW' : 'RPM'}
                </span>
                {showTool && (
                    <>
                        <span className="h-5 w-px bg-gray-200 dark:bg-dark-lighter" />
                        <span className="whitespace-nowrap px-2.5 py-1">
                            Tool <strong className="inline-block w-[3ch] text-right tabular-nums text-gray-900 dark:text-white font-mono">{currentTool}</strong>
                        </span>
                    </>
                )}
            </div>
            <div className="flex-1" />
            <span className="font-mono text-gray-400 dark:text-gray-500">
                <Clock />
            </span>
        </div>
    );
}
