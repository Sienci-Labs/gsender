import Button from 'app/components/Button';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

import MountingSetup from './MountingSetup';
import {
    getZAxisProbing,
    getYAxisAlignmentProbing,
    runProbing,
} from './utils/probeCommands';
import {
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    WORKFLOW_STATE_RUNNING,
    WORKSPACE_MODE,
} from 'app/constants';
import { useNavigate } from 'react-router';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

const Actions = () => {
    const navigate = useNavigate();
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );
    const workflow = useTypedSelector((state) => state.controller.workflow);
    const activeState = useTypedSelector(
        (state) => state.controller.state?.status?.activeState,
    );
    const firmwareType = useTypedSelector((state) => state.controller.type);
    const { mode: workspaceMode } = useWorkspaceState();

    const isInRotaryMode = workspaceMode === WORKSPACE_MODE.ROTARY;

    return (
        <div className="grid grid-cols-2 gap-3">
            <Button
                size="sm"
                onClick={() => navigate('/tools/rotary-surfacing')}
                disabled={firmwareType === GRBL && !isInRotaryMode}
                tooltip={{
                    content: 'Open rotary surfacing tool',
                }}
            >
                Rotary Surfacing
            </Button>
            <MountingSetup
                isDisabled={
                    isInRotaryMode ||
                    workflow.state === WORKFLOW_STATE_RUNNING ||
                    activeState !== GRBL_ACTIVE_STATE_IDLE
                }
            />
            <Button
                size="sm"
                variant="primary"
                onClick={() => {
                    Confirm({
                        title: 'Rotary Z-Axis probing',
                        content:
                            "Click 'Run' to start the Rotary Z-Axis probing cycle",
                        confirmLabel: 'Run',
                        onConfirm: () => {
                            runProbing('Rotary Z-Axis', getZAxisProbing());
                        },
                    });
                }}
                disabled={
                    !isConnected ||
                    (firmwareType === GRBL && !isInRotaryMode) ||
                    workflow.state === WORKFLOW_STATE_RUNNING ||
                    activeState !== GRBL_ACTIVE_STATE_IDLE
                }
                tooltip={{
                    content: 'Run rotary Z-axis probing',
                    side: 'left',
                }}
            >
                Probe Rotary Z-Axis
            </Button>
            <Button
                size="sm"
                variant="primary"
                onClick={() => {
                    Confirm({
                        title: 'Rotary Y-Axis alignment',
                        content:
                            "Click 'Run' to start the Rotary Y-Axis alignment cycle",
                        confirmLabel: 'Run',
                        onConfirm: () => {
                            runProbing(
                                'Y-Axis Alignment',
                                getYAxisAlignmentProbing(),
                            );
                        },
                    });
                }}
                disabled={
                    !isConnected ||
                    isInRotaryMode ||
                    workflow.state === WORKFLOW_STATE_RUNNING ||
                    activeState !== GRBL_ACTIVE_STATE_IDLE
                }
                tooltip={{
                    content: 'Run rotary Y-axis alignment',
                    side: 'left',
                }}
            >
                Y-Axis Alignment
            </Button>
        </div>
    );
};

export default Actions;
