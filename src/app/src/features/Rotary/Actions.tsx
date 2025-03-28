import Button from 'app/components/Button';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import { getUnitModal } from 'app/lib/toolChangeUtils';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

import RotarySurfacing from './RotarySurfacing';
import MountingSetup from './MountingSetup';
import {
    getZAxisProbing,
    getYAxisAlignmentProbing,
} from './utils/probeCommands';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import useKeybinding from 'app/lib/useKeybinding';
import { TOOLBAR_CATEGORY } from 'app/constants';

const Actions = () => {
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );

    const runProbing = (name = 'rotary', commands: string) => {
        toast.info(`Running ${name} probing commands`);

        const unitModal = getUnitModal();

        controller.command('gcode:safe', commands, unitModal);
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
        <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
            <RotarySurfacing />
            <Button
                size="sm"
                onClick={() => runProbing('Rotary Z-Axis', getZAxisProbing())}
                disabled={!isConnected}
            >
                Probe Rotary Z-Axis
            </Button>
            <Button
                size="sm"
                onClick={() =>
                    runProbing('Y-Axis Alignment', getYAxisAlignmentProbing())
                }
                disabled={!isConnected}
            >
                Y-Axis Alignment
            </Button>
            <MountingSetup />
        </div>
    );
};

export default Actions;
