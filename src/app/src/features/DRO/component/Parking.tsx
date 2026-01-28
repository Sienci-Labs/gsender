import { RiParkingFill } from 'react-icons/ri';

import Button from 'app/components/Button';
import store from 'app/store';
import controller from 'app/lib/controller.ts';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    LOCATION_CATEGORY,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { useEffect } from 'react';
import Tooltip from 'app/components/Tooltip';
import { get, includes } from 'lodash';
import reduxStore from 'app/store/redux';

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

export function Parking({
    disabled = false,
    isConnected = false,
    homingEnabled = false,
}) {
    const shortcutIsDisabled = () => {
        const isConnected = get(
            reduxStore.getState(),
            'connection.isConnected',
        );
        const activeState = get(
            reduxStore.getState(),
            'controller.state.status.activeState',
        );
        const workflowState = get(
            reduxStore.getState(),
            'controller.workflow.state',
        );

        if (!isConnected) return true;
        if (workflowState === WORKFLOW_STATE_RUNNING) return true;

        const states = [GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG];

        return !includes(states, activeState);
    };

    const shuttleControlEvents = {
        HOMING_PARK: {
            title: 'Park ',
            keys: '',
            cmd: 'HOMING_PARK',
            preventDefault: false,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: () => {
                if (shortcutIsDisabled()) {
                    return;
                }
                goToParkLocation();
            },
        },
    };

    useShuttleEvents(shuttleControlEvents);
    useEffect(() => {
        useKeybinding(shuttleControlEvents);
    }, []);

    if (!isConnected || !homingEnabled) {
        return null;
    }

    return (
        <Tooltip content="Go to Park Location">
            <Button
                disabled={disabled}
                icon={<RiParkingFill className="w-4 h-4" />}
                variant="alt"
                className="portrait:min-w-14"
                onClick={goToParkLocation}
            />
        </Tooltip>
    );
}
