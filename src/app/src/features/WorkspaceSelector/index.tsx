import { usePostHog } from '@posthog/react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';
import Tooltip from 'app/components/Tooltip';
import { GRBL_ACTIVE_STATE_RUN, WORKFLOW_STATE_RUNNING } from 'app/constants';
import controller from 'app/lib/controller.ts';
import type { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const availableWorkspaces = {
    G54: 'P1',
    G55: 'P2',
    G56: 'P3',
    G57: 'P4',
    G58: 'P5',
    G59: 'P6',
};

export type GrblWorkspace = 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';

// Matches the pendant's per-workspace accent colors (see
// src/pendant/src/components/WorkspaceSelector.tsx) so the two apps read
// the same workspace as the same color.
const WORKSPACE_TEXT_COLORS: Record<GrblWorkspace, string> = {
    G54: 'text-blue-600 dark:text-blue-400',
    G55: 'text-emerald-600 dark:text-emerald-400',
    G56: 'text-amber-600 dark:text-amber-400',
    G57: 'text-violet-600 dark:text-violet-400',
    G58: 'text-rose-600 dark:text-rose-400',
    G59: 'text-cyan-600 dark:text-cyan-400',
};

export function WorkspaceSelector() {
    const posthog = usePostHog();
    const activeWorkspace = useSelector(
        (state: RootState) => state.controller.modal.wcs,
    );
    const isConnected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const activeState = useSelector(
        (state: RootState) => state.controller.state.status?.activeState,
    );

    const workflowState = useSelector(
        (state: RootState) => state.controller.workflow.state,
    );

    const [workspace, setWorkspace] = useState<GrblWorkspace>('G54');

    // Update selected workspace if it changes elsewhere
    useEffect(() => {
        setWorkspace(activeWorkspace);
    }, [activeWorkspace]);

    function onWorkspaceSelect(value: GrblWorkspace) {
        setWorkspace(value);
        controller.command('gcode', value);
        posthog?.capture('workspace_selected', { workspace: value });
    }

    const disabled =
        !isConnected ||
        activeState === GRBL_ACTIVE_STATE_RUN ||
        workflowState === WORKFLOW_STATE_RUNNING;

    return (
        <div className="absolute top-4 right-4 w-56 flex flex-row items-center justify-end gap-2">
            <span className="text-gray-400 dark:text-content-muted text-normal">
                Workspace:
            </span>
            <Tooltip content="Select a workspace" side="left">
                <div>
                    <Select
                        onValueChange={onWorkspaceSelect}
                        value={workspace}
                        disabled={disabled}
                    >
                        <SelectTrigger
                            className="workspace-select-trigger max-w-24 h-7 bg-white dark:bg-surface-elevated dark:text-content-primary rounded-md border-solid border border-gray-300 dark:border-outline focus:ring-0 focus:ring-offset-0"
                            aria-label="Select workspace"
                        >
                            <SelectValue placeholder="G54" />
                        </SelectTrigger>
                        <SelectContent className="flex-1 bg-white dark:bg-surface-raised dark:border-outline">
                            <SelectGroup className="bg-white dark:bg-surface-raised">
                                {Object.entries(availableWorkspaces).map(
                                    (option, _index) => {
                                        const [key, value] = option as [
                                            GrblWorkspace,
                                            string,
                                        ];
                                        return (
                                            <SelectItem
                                                key={key}
                                                value={key}
                                                className="bg-white dark:bg-surface-raised dark:focus:bg-surface-hover h-8"
                                            >
                                                <span
                                                    className={`font-semibold ${WORKSPACE_TEXT_COLORS[key]}`}
                                                >
                                                    {`${key} (${value})`}
                                                </span>
                                            </SelectItem>
                                        );
                                    },
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </Tooltip>
        </div>
    );
}
