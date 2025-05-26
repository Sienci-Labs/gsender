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
import { TOOLBAR_CATEGORY } from 'app/constants';
import { useNavigate } from 'react-router';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';

const Actions = () => {
    const navigate = useNavigate();
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );

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
            title: 'Run Probe Rotary Z-Axis',
            keys: '',
            cmd: 'PROBE_ROTARY_Z_AXIS',
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
            callback: () => runProbing('Rotary Z-Axis', getZAxisProbing()),
        },
        PROBE_ROTARY_Y_AXIS: {
            title: 'Run Y-Axis Alignment Probing',
            keys: '',
            cmd: 'PROBE_ROTARY_Y_AXIS',
            preventDefault: false,
            isActive: true,
            category: TOOLBAR_CATEGORY,
            callback: () =>
                runProbing('Rotary Y-Axis', getYAxisAlignmentProbing()),
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    return (
        <div className="grid grid-cols-2 gap-3">
            <Button
                size="sm"
                onClick={() => navigate('/tools/rotary-surfacing')}
            >
                Rotary Surfacing
            </Button>
            <MountingSetup />
            <Button
                size="sm"
                variant="primary"
                onClick={() => runProbing('Rotary Z-Axis', getZAxisProbing())}
                disabled={!isConnected}
            >
                Probe Rotary Z-Axis
            </Button>
            <Button
                size="sm"
                variant="primary"
                onClick={() =>
                    runProbing('Y-Axis Alignment', getYAxisAlignmentProbing())
                }
                disabled={!isConnected}
            >
                Y-Axis Alignment
            </Button>
        </div>
    );
};

export default Actions;
