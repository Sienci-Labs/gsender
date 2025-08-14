import Button from 'app/components/Button';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import { getUnitModal } from 'app/lib/toolChangeUtils';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

import MountingSetup from './MountingSetup';
import {
    getZAxisProbing,
    getYAxisAlignmentProbing,
} from './utils/probeCommands';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import useKeybinding from 'app/lib/useKeybinding';
import { GRBL, TOOLBAR_CATEGORY, WORKSPACE_MODE } from 'app/constants';
import { useNavigate } from 'react-router';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { get } from 'lodash';
import store from 'app/store';
import reduxStore from 'app/store/redux';

const Actions = () => {
    const navigate = useNavigate();
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );
    const firmwareType = useTypedSelector((state) => state.controller.type);
    const { mode: workspaceMode } = useWorkspaceState();

    const runProbing = (name = 'rotary', commands: string) => {
        Confirm({
            title: `${name} probing`,
            content: `Click 'Run' to start the ${name} probing cycle`,
            confirmLabel: `Run`,
            onConfirm: () => {
                toast.info(`Running ${name} probing commands`, {
                    position: 'bottom-right',
                });
                const unitModal = getUnitModal();

                controller.command('gcode:safe', commands, unitModal);
            },
        });
    };

    const shuttleControlEvents = {
        PROBE_ROTARY_Z_AXIS: {
            title: 'Rotary Probe Z-axis',
            keys: '',
            cmd: 'PROBE_ROTARY_Z_AXIS',
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
            callback: () => {
                const isConnected = get(
                    reduxStore.getState(),
                    'connection.isConnected',
                );
                const firmwareType = get(
                    reduxStore.getState(),
                    'controller.type',
                );
                const workspaceMode = store.get('workspace.mode');
                const isInRotaryMode = workspaceMode === WORKSPACE_MODE.ROTARY;
                if (
                    !isConnected ||
                    (firmwareType === GRBL && !isInRotaryMode)
                ) {
                    return;
                }
                runProbing('Rotary Z-Axis', getZAxisProbing());
            },
        },
        PROBE_ROTARY_Y_AXIS: {
            title: 'Rotary Y-axis Alignment',
            keys: '',
            cmd: 'PROBE_ROTARY_Y_AXIS',
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
            callback: () => {
                const isConnected = get(
                    reduxStore.getState(),
                    'connection.isConnected',
                );
                const workspaceMode = store.get('workspace.mode');
                const isInRotaryMode = workspaceMode === WORKSPACE_MODE.ROTARY;
                if (!isConnected || isInRotaryMode) {
                    return;
                }
                runProbing('Rotary Y-Axis', getYAxisAlignmentProbing());
            },
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    const isInRotaryMode = workspaceMode === WORKSPACE_MODE.ROTARY;

    return (
        <div className="grid grid-cols-2 gap-3">
            <Button
                size="sm"
                onClick={() => navigate('/tools/rotary-surfacing')}
                disabled={firmwareType === GRBL && !isInRotaryMode}
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
            >
                Y-Axis Alignment
            </Button>
        </div>
    );
};

export default Actions;
