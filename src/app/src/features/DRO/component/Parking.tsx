import { IconButton } from 'app/components/IconButton';
import { RiParkingFill } from 'react-icons/ri';
import store from 'app/store';
import controller from 'app/lib/controller.ts';

function goToParkLocation() {
    const park = store.get('workspace.park', {});
    const code = [];

    // Move up to safe height
    code.push('G53 G21 G0 Z-1');
    // Move to Park XY
    code.push(`G53 G21 G0 X${park.x} Y${park.y}`);
    //Move to Park Z
    code.push(`G53 G21 G0 Z${park.z}`);
    controller.command('gcode', code);
}

export function Parking() {
    return (
        <IconButton
            icon={<RiParkingFill />}
            variant="primary"
            onClick={goToParkLocation}
        />
    );
}
