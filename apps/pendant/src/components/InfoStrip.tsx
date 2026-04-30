import { useEffect, useState } from 'react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import controller from '@gsender/controller-client/controller';
import { GRBL_ACTIVE_STATE_RUN, WORKFLOW_STATE_RUNNING } from 'app/constants';

type GrblWorkspace = 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';

const WORKSPACE_VALUES: GrblWorkspace[] = ['G54', 'G55', 'G56', 'G57', 'G58', 'G59'];

const WORKSPACE_COLORS: Record<GrblWorkspace, string> = {
    G54: 'bg-blue-600 text-white border-blue-700 dark:border-blue-500',
    G55: 'bg-emerald-600 text-white border-emerald-700 dark:border-emerald-500',
    G56: 'bg-amber-500 text-white border-amber-600 dark:border-amber-400',
    G57: 'bg-violet-600 text-white border-violet-700 dark:border-violet-500',
    G58: 'bg-rose-600 text-white border-rose-700 dark:border-rose-500',
    G59: 'bg-cyan-600 text-white border-cyan-700 dark:border-cyan-500',
};

function isWorkspace(value: unknown): value is GrblWorkspace {
    return typeof value === 'string' && WORKSPACE_VALUES.includes(value as GrblWorkspace);
}

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

export default function InfoStrip() {
    const activeWorkspace = useTypedSelector((state: RootState) => state.controller.modal.wcs);
    const isConnected = useTypedSelector((state: RootState) => state.connection.isConnected);
    const activeState = useTypedSelector((state: RootState) => state.controller.state.status?.activeState);
    const workflowState = useTypedSelector((state: RootState) => state.controller.workflow.state);
    const [workspace, setWorkspace] = useState<GrblWorkspace>('G54');

    useEffect(() => {
        if (isWorkspace(activeWorkspace)) {
            setWorkspace(activeWorkspace);
        }
    }, [activeWorkspace]);

    const disabled =
        !isConnected ||
        activeState === GRBL_ACTIVE_STATE_RUN ||
        workflowState === WORKFLOW_STATE_RUNNING;

    const onWorkspaceSelect = (value: GrblWorkspace) => {
        if (disabled || workspace === value) {
            return;
        }
        setWorkspace(value);
        controller.command('gcode', value);
    };

    return (
        <div className="flex items-center gap-3 px-3 md:px-4 py-1.5 bg-white border-b border-gray-200 dark:bg-dark dark:border-dark-lighter shrink-0 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span className="hidden lg:inline">Feed <strong className="text-gray-900 dark:text-white font-mono">0</strong> mm/min</span>
            <span className="hidden xl:inline">Spindle <strong className="text-gray-900 dark:text-white font-mono">0</strong> RPM</span>
            <span className="hidden md:inline">Units <strong className="text-gray-900 dark:text-white">mm</strong></span>
            <div className={`flex items-center gap-1.5 shrink-0 ${disabled ? 'opacity-70' : ''}`}>
                <span className="text-gray-400 dark:text-gray-500">G54-&gt;G59</span>
                <div className="flex items-center rounded-md border border-gray-200 dark:border-dark-lighter overflow-hidden bg-white dark:bg-dark-darker">
                    {WORKSPACE_VALUES.map((value, index) => {
                        const isActive = workspace === value;
                        return (
                            <button
                                key={value}
                                onClick={() => onWorkspaceSelect(value)}
                                disabled={disabled}
                                className={`h-7 min-w-[2.6rem] px-2 text-xs font-semibold transition-colors ${
                                    index > 0 ? 'border-l border-gray-200 dark:border-dark-lighter' : ''
                                } ${
                                    isActive
                                        ? WORKSPACE_COLORS[value]
                                        : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter'
                                } ${disabled ? 'cursor-default' : ''}`}
                                aria-pressed={isActive}
                                aria-label={`Switch workspace to ${value}`}
                            >
                                {value}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="flex-1" />
            <span className="font-mono text-gray-400 dark:text-gray-500">
                <Clock />
            </span>
        </div>
    );
}
