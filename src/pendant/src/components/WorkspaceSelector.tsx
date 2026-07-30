import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import controller from '@gsender/controller-client/controller';
import { GRBL_ACTIVE_STATE_RUN, WORKFLOW_STATE_RUNNING } from 'app/constants';

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

export default function WorkspaceSelector() {
    const activeWorkspace = useTypedSelector((state: RootState) => state.controller.modal.wcs);
    const isConnected = useTypedSelector((state: RootState) => state.connection.isConnected);
    const activeState = useTypedSelector((state: RootState) => state.controller.state.status?.activeState);
    const workflowState = useTypedSelector((state: RootState) => state.controller.workflow.state);

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

    return (
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
    );
}
