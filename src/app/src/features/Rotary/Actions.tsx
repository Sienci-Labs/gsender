import Button from 'app/components/Button';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

import MountingSetup from './MountingSetup';
import {
    getZAxisProbing,
    getYAxisAlignmentProbing,
    runProbing,
} from './utils/probeCommands';
import { GRBL, WORKSPACE_MODE } from 'app/constants';
import { useNavigate } from 'react-router';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

const Actions = () => {
    const navigate = useNavigate();
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
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
            <MountingSetup isDisabled={isInRotaryMode} />
            <Button
                size="sm"
                variant="primary"
                onClick={() => runProbing('Rotary Z-Axis', getZAxisProbing())}
                disabled={
                    !isConnected || (firmwareType === GRBL && !isInRotaryMode)
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
                onClick={() =>
                    runProbing('Y-Axis Alignment', getYAxisAlignmentProbing())
                }
                disabled={!isConnected || isInRotaryMode}
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
