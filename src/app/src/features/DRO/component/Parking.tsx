import { IconButton } from 'app/components/IconButton';
import { RiParkingFill } from 'react-icons/ri';
import store from 'app/store';
import controller from 'app/lib/controller.ts';
import { LOCATION_CATEGORY } from 'app/constants';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';

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
    const shuttleControlEvents = {
        HOMING_PARK: {
            title: 'Park ',
            keys: '',
            cmd: 'HOMING_PARK',
            preventDefault: false,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => goToParkLocation(),
        },
    };

    useShuttleEvents(shuttleControlEvents);
    useKeybinding(shuttleControlEvents);

    return (
        <IconButton
            icon={<RiParkingFill />}
            variant="primary"
            onClick={goToParkLocation}
        />
    );
}
