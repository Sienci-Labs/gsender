import { useEffect, useRef, useState } from 'react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import controller from '@gsender/controller-client/controller';
import { GRBL_ACTIVE_STATE_RUN, METRIC_UNITS, WORKFLOW_STATE_RUNNING } from 'app/constants';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { mapPositionToUnits } from 'app/lib/units';
import { ChevronDown } from 'lucide-react';

type GrblWorkspace = 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';

const WORKSPACE_VALUES: GrblWorkspace[] = ['G54', 'G55', 'G56', 'G57', 'G58', 'G59'];

const WORKSPACE_TEXT_COLORS: Record<GrblWorkspace, string> = {
    G54: 'text-blue-600 dark:text-blue-400',
    G55: 'text-emerald-600 dark:text-emerald-400',
    G56: 'text-amber-600 dark:text-amber-400',
    G57: 'text-violet-600 dark:text-violet-400',
    G58: 'text-rose-600 dark:text-rose-400',
    G59: 'text-cyan-600 dark:text-cyan-400',
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

function formatReadout(value: unknown): string {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '0';
    const rounded = Math.round(parsed * 100) / 100;
    return Number.isInteger(rounded)
        ? String(rounded)
        : String(rounded).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
}

export default function InfoStrip() {
    const activeWorkspace = useTypedSelector((state: RootState) => state.controller.modal.wcs);
    const isConnected = useTypedSelector((state: RootState) => state.connection.isConnected);
    const activeState = useTypedSelector((state: RootState) => state.controller.state.status?.activeState);
    const workflowState = useTypedSelector((state: RootState) => state.controller.workflow.state);
    const status = useTypedSelector((state: RootState) => state.controller.state.status) as any;
    const { units } = useWorkspaceState();
    const [workspace, setWorkspace] = useState<GrblWorkspace>('G54');
    const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
    const workspaceMenuRef = useRef<HTMLDivElement | null>(null);

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

    useEffect(() => {
        if (!workspaceMenuOpen) return;

        const onPointerDown = (event: globalThis.MouseEvent) => {
            const target = event.target as Node | null;
            if (!workspaceMenuRef.current || !target) return;
            if (!workspaceMenuRef.current.contains(target)) {
                setWorkspaceMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
        };
    }, [workspaceMenuOpen]);

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
            <div ref={workspaceMenuRef} className={`relative flex items-center shrink-0 ${disabled ? 'opacity-70' : ''}`}>
                <button
                    type="button"
                    aria-label="Select workspace"
                    aria-haspopup="listbox"
                    aria-expanded={workspaceMenuOpen}
                    onClick={() => setWorkspaceMenuOpen((current) => !current)}
                    className={`h-7 min-w-[5.25rem] rounded-md border border-gray-200 dark:border-dark-lighter bg-white dark:bg-dark-darker px-2 text-xs font-semibold outline-none transition-colors flex items-center justify-between gap-1 ${WORKSPACE_TEXT_COLORS[workspace]} ${disabled ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-lighter'}`}
                >
                    <span>{workspace}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${workspaceMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {workspaceMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 z-50 w-24 rounded-md border border-gray-200 dark:border-dark-lighter bg-white dark:bg-dark-darker shadow-lg p-1">
                        {WORKSPACE_VALUES.map((value) => (
                            <button
                                key={value}
                                type="button"
                                role="option"
                                aria-selected={workspace === value}
                                onClick={() => {
                                    onWorkspaceSelect(value);
                                    setWorkspaceMenuOpen(false);
                                }}
                                className={`w-full h-7 rounded text-xs font-semibold transition-colors ${WORKSPACE_TEXT_COLORS[value]} ${workspace === value ? 'bg-gray-100 dark:bg-dark-lighter' : 'hover:bg-gray-100 dark:hover:bg-dark-lighter'} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex-1" />
            <span className="font-mono text-gray-400 dark:text-gray-500">
                <Clock />
            </span>
        </div>
    );
}
