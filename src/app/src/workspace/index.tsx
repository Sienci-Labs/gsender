import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import get from 'lodash/get';

import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import {
    GENERAL_CATEGORY,
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_IDLE,
    GRBLHAL,
    LOCATION_CATEGORY,
} from 'app/constants';
import useKeybinding from 'app/lib/useKeybinding';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

import { Carve } from './Carve';
import { Alerts } from './Alerts';
import DataCollection from '../features/DataCollection';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { useDarkMode } from 'app/hooks/useDarkMode';

const Workspace = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const { hash } = location;
        console.log(hash);
        if (hash === '#/remote') {
            navigate('/remote');
        } else if (hash === '#/console') {
            navigate('/console');
        }
    }, [location]);

    useDarkMode();

    const shuttleControlFunctions = {
        CONTROLLER_COMMAND: (_: Event, { command }: any) => {
            const state = get(reduxStore.getState(), 'controller.state.status');
            const activeState = get(state, 'activeState', 'Idle');
            const alarmCode = get(state, 'alarmCode', 0);

            const commandIsValidForAlarmState = [
                'reset',
                'reset:limit',
                'homing',
            ].includes(command);
            const isInAlarmState = activeState === GRBL_ACTIVE_STATE_ALARM;
            // feedhold, cyclestart, homing, unlock, reset
            if (
                (commandIsValidForAlarmState && isInAlarmState) ||
                (command !== 'reset:limit' &&
                    activeState === GRBL_ACTIVE_STATE_IDLE)
            ) {
                // unlock + reset on alarm 1 and 2, just unlock on others
                if (
                    activeState === GRBL_ACTIVE_STATE_ALARM &&
                    alarmCode !== 1 &&
                    alarmCode !== 2
                ) {
                    command = 'unlock';
                }
                controller.command(command);
            }
        },
    };

    const shuttleControlEvents = {
        CONTROLLER_COMMAND_UNLOCK: {
            title: 'Unlock',
            keys: '$',
            cmd: 'CONTROLLER_COMMAND_UNLOCK',
            payload: {
                command: 'reset:limit',
            },
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: shuttleControlFunctions.CONTROLLER_COMMAND,
        },
        CONTROLLER_COMMAND_RESET: {
            title: 'Soft Reset',
            keys: '%',
            cmd: 'CONTROLLER_COMMAND_RESET',
            payload: {
                command: 'reset',
            },
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: shuttleControlFunctions.CONTROLLER_COMMAND,
        },
        CONTROLLER_COMMAND_HOMING: {
            title: 'Homing',
            keys: ['ctrl', 'alt', 'command', 'h'].join('+'),
            cmd: 'CONTROLLER_COMMAND_HOMING',
            payload: {
                command: 'homing',
            },
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: shuttleControlFunctions.CONTROLLER_COMMAND,
        },
        CONTROLLER_COMMAND_REALTIME_REPORT: {
            title: 'Realtime Report',
            keys: '`',
            cmd: 'CONTROLLER_COMMAND_REALTIME_REPORT',
            payload: {
                command: 'realtime_report',
                type: GRBLHAL,
            },
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: shuttleControlFunctions.CONTROLLER_COMMAND,
        },
        CONTROLLER_COMMAND_ERROR_CLEAR: {
            title: 'Error Clear',
            keys: '*',
            cmd: 'CONTROLLER_COMMAND_ERROR_CLEAR',
            payload: {
                command: 'error_clear',
                type: GRBLHAL,
            },
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: shuttleControlFunctions.CONTROLLER_COMMAND,
        },
        CONTROLLER_COMMAND_TOOLCHANGE_ACKNOWLEDGEMENT: {
            title: 'Toolchange Acknowledgement',
            keys: ['ctrl', 'alt', 'command', 'a'].join('+'),
            cmd: 'CONTROLLER_COMMAND_TOOLCHANGE_ACKNOWLEDGEMENT',
            payload: {
                command: 'toolchange:acknowledge',
                type: GRBLHAL,
            },
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: shuttleControlFunctions.CONTROLLER_COMMAND,
        },
        CONTROLLER_COMMAND_VIRTUAL_STOP_TOGGLE: {
            title: 'Virtual Stop Toggle',
            keys: ['ctrl', '8'].join('+'),
            cmd: 'CONTROLLER_COMMAND_VIRTUAL_STOP_TOGGLE',
            payload: {
                command: 'virtual_stop_toggle',
                type: GRBLHAL,
            },
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: shuttleControlFunctions.CONTROLLER_COMMAND,
        },
        CUT: {
            title: 'Cut',
            keys: ['ctrl', 'x'].join('+'),
            cmd: 'CUT',
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: () => {
                document.execCommand('cut');
            },
        },
        COPY: {
            title: 'Copy',
            keys: ['ctrl', 'c'].join('+'),
            cmd: 'COPY',
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: () => {
                document.execCommand('copy');
            },
        },
        PASTE: {
            title: 'Paste',
            keys: ['ctrl', 'v'].join('+'),
            cmd: 'PASTE',
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: () => {
                document.execCommand('paste');
            },
        },
        UNDO: {
            title: 'Undo',
            keys: ['ctrl', 'z'].join('+'),
            cmd: 'UNDO',
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: () => {
                document.execCommand('undo');
            },
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    return (
        <div className="flex flex-col h-full dark:bg-slate-800">
            <TopBar />
            <DataCollection />
            <div className="flex h-full no-scrollbar ">
                <Sidebar />
                <Alerts />
                <div className="w-full max-sm:p-4">
                    <Carve />
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Workspace;
