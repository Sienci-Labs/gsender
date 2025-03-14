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

const Actions = () => {
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );

    const runProbing = (name = 'rotary', commands: string) => {
        toast.info(`Running ${name} probing commands`);

        const unitModal = getUnitModal();

        controller.command('gcode:safe', commands, unitModal);
    };

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
