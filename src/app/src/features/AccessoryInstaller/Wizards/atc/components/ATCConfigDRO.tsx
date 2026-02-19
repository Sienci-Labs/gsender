import get from 'lodash/get';
import includes from 'lodash/includes';
import mapValues from 'lodash/mapValues';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { defaultDROPosition } from 'app/features/DRO/utils/DRO';
import { mapPositionToUnits } from 'app/lib/units.ts';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';

export function ATCConfigDRO() {
    const { units: preferredUnits } = useWorkspaceState();
    const wposController = useTypedSelector(
        (state) => state.controller.wpos,
    );
    const mposController = useTypedSelector(
        (state) => state.controller.mpos,
    );
    const workflowState = useTypedSelector(
        (state) => state.controller.workflow.state,
    );
    const activeState = useTypedSelector(
        (state) => state.controller.state.status.activeState,
    );
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );

    const wpos = mapValues(
        wposController || defaultDROPosition,
        (pos) => mapPositionToUnits(pos, preferredUnits),
    );

    const canClick = (() => {
        if (!isConnected) return false;
        if (workflowState === WORKFLOW_STATE_RUNNING) return false;
        const states = [GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG];
        return includes(states, activeState);
    })();

    return (
        <div className="bg-white dark:bg-dark rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex flex-col w-full gap-2">
                {(['x', 'y', 'z'] as const).map((axis) => (
                    <div
                        key={axis}
                        className="border border-gray-200 dark:border-gray-700 rounded-md w-full flex items-center justify-between px-3 py-2"
                    >
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {axis.toUpperCase()}
                        </span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                            {get(wpos, axis, '0')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
