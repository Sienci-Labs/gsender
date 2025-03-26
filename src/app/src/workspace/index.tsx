import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import get from 'lodash/get';

import controller from 'app/lib/controller';
import reduxStore from 'app/store/redux';
import store from 'app/store';
import { toggleAllShortcuts } from 'app/store/redux/slices/keyboardShortcutsSlice';
import {
    GENERAL_CATEGORY,
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_IDLE,
    GRBLHAL,
    LOCATION_CATEGORY,
    WORKSPACE_MODE,
} from 'app/constants';
import GamepadManager from 'app/lib/gamepad';
import useKeybinding from 'app/lib/useKeybinding';

import { useRegisterShortcuts } from '../features/Keyboard/useRegisterShortcuts';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

import { Carve } from './Carve';
import { Alerts } from './Alerts';
import DataCollection from '../features/DataCollection';

const Workspace = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const { hash } = location;
        if (hash === '#/remote') {
            navigate('/remote');
        }
    }, [location]);

    useEffect(() => {
        GamepadManager.initialize();

        useKeybinding(shuttleControlEvents);

        return () => {
            GamepadManager.cleanup();
        };
    }, []);

    const shuttleControlFunctions = {
        CONTROLLER_COMMAND: (_: Event, { command }: any) => {
            const state = get(reduxStore.getState(), 'controller.state.status');
            const activeState = get(state, 'activeState', 'Idle');
            const alarmCode = get(state, 'alarmCode', 0);

            console.log('command', command);

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
    };

    useRegisterShortcuts([
        {
            id: 'unlock-machine',
            title: 'Unlock Machine',
            description: 'Unlock the machine',
            defaultKeys: '$',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('unlock');
            },
        },
        {
            id: 'soft-reset-machine',
            title: 'Soft Reset Machine',
            description: 'Soft reset the machine',
            defaultKeys: '%',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('reset');
            },
        },
        {
            id: 'browser-cut',
            title: 'Cut',
            description: 'Cut selected content to clipboard',
            defaultKeys: 'ctrl+x',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                if (typeof window === 'undefined') return;
                try {
                    navigator.clipboard.writeText(
                        window.getSelection()?.toString() || '',
                    );
                    window.getSelection()?.deleteFromDocument();
                } catch (error) {
                    console.error(error);
                }
            },
        },
        {
            id: 'browser-copy',
            title: 'Copy',
            description: 'Copy selected content to clipboard',
            defaultKeys: 'ctrl+c',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                if (typeof window === 'undefined') return;
                try {
                    navigator.clipboard.writeText(
                        window.getSelection()?.toString() || '',
                    );
                } catch (error) {
                    console.error(error);
                }
            },
        },
        {
            id: 'browser-paste',
            title: 'Paste',
            description: 'Paste content from clipboard',
            defaultKeys: 'ctrl+v',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                try {
                    navigator.clipboard.readText().then((text) => {
                        document.execCommand('insertText', false, text);
                    });
                } catch (error) {
                    console.error(error);
                }
            },
        },
        {
            id: 'undo',
            title: 'Undo',
            description: 'Undo the last action',
            defaultKeys: 'ctrl+z',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                document.execCommand('undo');
            },
        },
        {
            id: 'toggle-shortcuts',
            title: 'Toggle Shortcuts',
            description: 'Enable or disable all keyboard shortcuts',
            defaultKeys: '^',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                reduxStore.dispatch(toggleAllShortcuts());
            },
        },
        {
            id: 'realtime-report',
            title: 'Realtime Report',
            description: 'Request realtime status report from grblHAL',
            defaultKeys: '`',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('realtime_report');
            },
        },
        {
            id: 'error-clear',
            title: 'Clear Errors',
            description: 'Clear all error messages',
            defaultKeys: '*',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('error_clear');
            },
        },
        {
            id: 'toolchange-acknowledge',
            title: 'Acknowledge Tool Change',
            description: 'Confirm tool change operation',
            defaultKeys: 'ctrl+alt+meta+a',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('toolchange:acknowledge');
            },
        },
        {
            id: 'virtual-stop-toggle',
            title: 'Toggle Virtual Stop',
            description: 'Enable or disable virtual stop functionality',
            defaultKeys: 'ctrl+8',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                controller.command('virtual_stop_toggle');
            },
        },
        {
            id: 'workspace-mode-switch',
            title: 'Switch Workspace Mode',
            description:
                'Toggle between different workspace modes (Default, Rotary, etc.)',
            defaultKeys: 'ctrl+5',
            category: 'GENERAL_CATEGORY',
            onKeyDown: () => {
                const currentWorkspaceMode = store.get(
                    'workspace.mode',
                    WORKSPACE_MODE.DEFAULT,
                );
                const workspaceModesList = Object.values(WORKSPACE_MODE);
                const currentWorkspaceModeIndex = workspaceModesList.findIndex(
                    (mode) => mode === currentWorkspaceMode,
                );
                const nextWorkspaceMode =
                    workspaceModesList[currentWorkspaceModeIndex + 1] ??
                    workspaceModesList[0];

                store.replace('workspace.mode', nextWorkspaceMode);
            },
        },
        {
            id: 'page-home',
            title: 'Go to Home Page',
            description: 'Go to the home page',
            defaultKeys: 'f1',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate('/');
            },
        },
        {
            id: 'page-stats-info',
            title: 'Go to Stats Info Page',
            description: 'Go to the stats info page',
            defaultKeys: 'f2',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate('/stats');
            },
        },
        {
            id: 'page-settings',
            title: 'Go to Settings Page',
            description: 'Go to the settings page',
            defaultKeys: 'f3',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate('/configuration');
            },
        },
        {
            id: 'page-tools',
            title: 'Go to Tools Page',
            description: 'Go to the tools page',
            defaultKeys: 'f4',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate('/tools');
            },
        },
        {
            id: 'page-squaring',
            title: 'Go to Squaring Page',
            description: 'Go to the squaring page',
            defaultKeys: 'f5',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate('/squaring');
            },
        },
        {
            id: 'page-movement-tuning',
            title: 'Go to Movement Tuning Page',
            description: 'Go to the movement tuning page',
            defaultKeys: 'f6',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate('/movement-tuning');
            },
        },
        {
            id: 'page-keyboard-shortcuts',
            title: 'Go to Keyboard Shortcuts Page',
            description: 'Go to the keyboard shortcuts page',
            defaultKeys: 'f7',
            category: 'TOOLBAR_CATEGORY',
            onKeyDown: () => {
                navigate('/keyboard-shortcuts');
            },
        },
    ]);

    return (
        <div className="flex flex-col h-full">
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
