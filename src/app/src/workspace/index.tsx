import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import get from 'lodash/get';

import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import {
    COOLANT_CATEGORY,
    GENERAL_CATEGORY,
    GRBL,
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_IDLE,
    GRBLHAL,
    LOCATION_CATEGORY,
    SPINDLE_LASER_CATEGORY,
    TOOLBAR_CATEGORY,
    WORKFLOW_STATE_RUNNING,
    WORKSPACE_MODE,
} from 'app/constants';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { useDarkMode } from 'app/hooks/useDarkMode';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

import { Carve } from './Carve';
import { Alerts } from './Alerts';
import DataCollection from '../features/DataCollection';
import pkg from '../../package.json';
import store from 'app/store';
import {
    getYAxisAlignmentProbing,
    getZAxisProbing,
    runProbing,
} from 'app/features/Rotary/utils/probeCommands';
import {
    canRunShortcut,
    startFlood,
    startMist,
    stopCoolant,
} from 'app/features/Coolant/utils/actions';
import pubsub from 'pubsub-js';
import ConfirmationDialog from 'app/components/ConfirmationDialog/ConfirmationDialog';

const Workspace = () => {
    const location = useLocation();

    useEffect(() => {
        const { pathname } = location;
        if (pathname === '/') {
            setTimeout(() => {
                window.dispatchEvent(new Event('resize')); // Manual resize dispatch for visualizer on navigating to carve
            }, 100);
        }

        document.title = `gSender ${pkg.version}`;
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
            title: 'Soft reset',
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
            title: 'Home machine',
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
            title: 'Realtime report',
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
            title: 'Clear error',
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
            title: 'Acknowledge tool change',
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
            title: 'Feed hold',
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
                const workflow = get(
                    reduxStore.getState(),
                    'controller.workflow',
                );
                const activeState = get(
                    reduxStore.getState(),
                    'controller.state',
                )?.status?.activeState;
                const workspaceMode = store.get('workspace.mode');
                const isInRotaryMode = workspaceMode === WORKSPACE_MODE.ROTARY;
                if (
                    !isConnected ||
                    (firmwareType === GRBL && !isInRotaryMode) ||
                    workflow.state === WORKFLOW_STATE_RUNNING ||
                    activeState !== GRBL_ACTIVE_STATE_IDLE
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
                const workflow = get(
                    reduxStore.getState(),
                    'controller.workflow',
                );
                const activeState = get(
                    reduxStore.getState(),
                    'controller.state',
                )?.status?.activeState;
                const workspaceMode = store.get('workspace.mode');
                const isInRotaryMode = workspaceMode === WORKSPACE_MODE.ROTARY;
                if (
                    !isConnected ||
                    isInRotaryMode ||
                    workflow.state === WORKFLOW_STATE_RUNNING ||
                    activeState !== GRBL_ACTIVE_STATE_IDLE
                ) {
                    return;
                }
                runProbing('Rotary Y-Axis', getYAxisAlignmentProbing());
            },
        },
        MIST_COOLANT: {
            title: 'Mist coolant (M7)',
            keys: '',
            cmd: 'MIST_COOLANT',
            preventDefault: false,
            isActive: true,
            category: COOLANT_CATEGORY,
            callback: () => {
                if (!canRunShortcut()) {
                    return;
                }
                startMist();
            },
        },
        FLOOD_COOLANT: {
            title: 'Flood coolant (M8)',
            keys: '',
            cmd: 'FLOOD_COOLANT',
            preventDefault: false,
            isActive: true,
            category: COOLANT_CATEGORY,
            callback: () => {
                if (!canRunShortcut()) {
                    return;
                }
                startFlood();
            },
        },
        STOP_COOLANT: {
            title: 'Stop coolant (M9)',
            keys: '',
            cmd: 'STOP_COOLANT',
            preventDefault: false,
            isActive: true,
            category: COOLANT_CATEGORY,
            callback: () => {
                if (!canRunShortcut()) {
                    return;
                }
                stopCoolant();
            },
        },
        TOGGLE_SPINDLE_LASER_MODE: {
            title: 'Toggle Between Spindle and Laser Mode',
            keys: '',
            cmd: 'TOGGLE_SPINDLE_LASER_MODE',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                pubsub.publish('shortcut:TOGGLE_SPINDLE_LASER_MODE');
            },
        },
        CW_LASER_ON: {
            title: 'CW / Laser On',
            keys: '',
            cmd: 'CW_LASER_ON',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                pubsub.publish('shortcut:CW_LASER_ON');
            },
        },
        CCW_LASER_TEST: {
            title: 'CCW / Laser Test',
            keys: '',
            cmd: 'CCW_LASER_TEST',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                pubsub.publish('shortcut:CCW_LASER_TEST');
            },
        },
        STOP_LASER_OFF: {
            title: 'Stop / Laser Off',
            keys: '',
            cmd: 'STOP_LASER_OFF',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                pubsub.publish('shortcut:STOP_LASER_OFF');
            },
        },
    };

    useShuttleEvents(shuttleControlEvents);
    useEffect(() => {
        useKeybinding(shuttleControlEvents);
    }, []);

    return (
        <div className="flex flex-col h-full dark:bg-slate-800">
            <TopBar />
            <ConfirmationDialog />
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
