/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */
import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
import get from 'lodash/get';
import without from 'lodash/without';
import _ from 'lodash';
import HeadlessIndicator from 'app/components/HeadlessIndicator';
import Push from 'push.js';
import isElectron from 'is-electron';
import pubsub from 'pubsub-js';

import reduxStore from 'app/store/redux';
import api from 'app/api';
import settings from 'app/config/settings';
import combokeys from 'app/lib/combokeys';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import gamepad, { runAction } from 'app/lib/gamepad';
import NavbarConnection from 'app/widgets/NavbarConnection';

import styles from './index.styl';
import NavLogo from '../../components/NavLogo';
import NavSidebar from '../NavSidebar';
import useKeybinding from '../../lib/useKeybinding';
import { GRBL_ACTIVE_STATE_ALARM, GRBL_ACTIVE_STATE_IDLE, GENERAL_CATEGORY, LOCATION_CATEGORY, GRBLHAL } from '../../constants';
import { Toaster, TOASTER_WARNING } from '../../lib/toaster/ToasterLib';

class Header extends PureComponent {
    static propTypes = {
        ...withRouter.propTypes
    };

    state = this.getInitialState();

    actions = {
        fetchCommands: async () => {
            try {
                const res = await api.commands.fetch({ paging: false });
                const { records: commands } = res.body;

                this._isMounted && this.setState({
                    commands: commands.filter(command => command.enabled)
                });
            } catch (res) {
                // Ignore error
            }
        },
        runCommand: async (cmd) => {
            try {
                const res = await api.commands.run(cmd.id);
                const { taskId } = res.body;

                this.setState({
                    commands: this.state.commands.map(c => {
                        return (c.id === cmd.id) ? { ...c, taskId: taskId, err: null } : c;
                    })
                });
            } catch (res) {
                // Ignore error
            }
        },
    };

    shuttleControlFunctions = {
        CONTROLLER_COMMAND: (event, { command, type }) => {
            const state = get(reduxStore.getState(), 'controller.state.status');
            const activeState = get(state, 'activeState', 'Idle');
            const alarmCode = get(state, 'alarmCode', 0);
            const controllerType = get(reduxStore.getState(), 'controller.type');
            // if it's a grblHAL only shortcut, don't run it
            if (type === GRBLHAL && controllerType !== GRBLHAL) {
                this.showToast();
                return;
            }
            // feedhold, cyclestart, homing, unlock, reset
            if (((command === 'reset:limit' || command === 'homing') && activeState === GRBL_ACTIVE_STATE_ALARM) ||
                (command !== 'reset:limit' && activeState === GRBL_ACTIVE_STATE_IDLE)) {
                // unlock + reset on alarm 1 and 2, just unlock on others
                if (activeState === GRBL_ACTIVE_STATE_ALARM && alarmCode !== 1 && alarmCode !== 2) {
                    command = 'unlock';
                }
                controller.command(command);
            }
        }
    }

    shuttleControlEvents = {
        CONTROLLER_COMMAND_UNLOCK: {
            title: 'Unlock',
            keys: '$',
            cmd: 'CONTROLLER_COMMAND_UNLOCK',
            payload: {
                command: 'reset:limit'
            },
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: this.shuttleControlFunctions.CONTROLLER_COMMAND
        },
        CONTROLLER_COMMAND_RESET: {
            title: 'Soft Reset',
            keys: '%',
            cmd: 'CONTROLLER_COMMAND_RESET',
            payload: {
                command: 'reset'
            },
            preventDefault: false,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: this.shuttleControlFunctions.CONTROLLER_COMMAND
        },
        CONTROLLER_COMMAND_HOMING: {
            title: 'Homing',
            keys: ['ctrl', 'alt', 'command', 'h'].join('+'),
            cmd: 'CONTROLLER_COMMAND_HOMING',
            payload: {
                command: 'homing'
            },
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.shuttleControlFunctions.CONTROLLER_COMMAND
        },
        CONTROLLER_COMMAND_REALTIME_REPORT: {
            title: 'Realtime Report',
            keys: '`',
            cmd: 'CONTROLLER_COMMAND_REALTIME_REPORT',
            payload: {
                command: 'realtime_report',
                type: GRBLHAL
            },
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: this.shuttleControlFunctions.CONTROLLER_COMMAND
        },
        CONTROLLER_COMMAND_ERROR_CLEAR: {
            title: 'Error Clear',
            keys: '*',
            cmd: 'CONTROLLER_COMMAND_ERROR_CLEAR',
            payload: {
                command: 'error_clear',
                type: GRBLHAL
            },
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: this.shuttleControlFunctions.CONTROLLER_COMMAND
        },
        CONTROLLER_COMMAND_TOOLCHANGE_ACKNOWLEDGEMENT: {
            title: 'Toolchange Acknowledgement',
            keys: ['ctrl', 'alt', 'command', 'a'].join('+'),
            cmd: 'CONTROLLER_COMMAND_TOOLCHANGE_ACKNOWLEDGEMENT',
            payload: {
                command: 'toolchange:acknowledge',
                type: GRBLHAL
            },
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: this.shuttleControlFunctions.CONTROLLER_COMMAND
        },
        CONTROLLER_COMMAND_VIRTUAL_STOP_TOGGLE: {
            title: 'Virtual Stop Toggle',
            keys: ['ctrl', '8'].join('+'),
            cmd: 'CONTROLLER_COMMAND_VIRTUAL_STOP_TOGGLE',
            payload: {
                command: 'virtual_stop_toggle',
                type: GRBLHAL
            },
            preventDefault: true,
            isActive: true,
            category: GENERAL_CATEGORY,
            callback: this.shuttleControlFunctions.CONTROLLER_COMMAND
        },
    };

    controllerEvents = {
        'disconnect': () => {
            this.setState({
                connected: false
            });
        },
        'connect': () => {
            this.setState({
                connected: true
            });
        },
        'config:change': () => {
            this.actions.fetchCommands();
        },
        'task:start': (taskId) => {
            this.setState({
                runningTasks: this.state.runningTasks.concat(taskId)
            });
        },
        'task:finish': (taskId, code) => {
            const err = (code !== 0) ? new Error(`errno=${code}`) : null;
            let cmd = null;

            this.setState({
                commands: this.state.commands.map(c => {
                    if (c.taskId !== taskId) {
                        return c;
                    }
                    cmd = c;
                    return {
                        ...c,
                        taskId: null,
                        err: err
                    };
                }),
                runningTasks: without(this.state.runningTasks, taskId)
            });

            if (cmd && this.state.pushPermission === Push.Permission.GRANTED) {
                Push.create(cmd.title, {
                    body: code === 0
                        ? i18n._('Command succeeded')
                        : i18n._('Command failed ({{err}})', { err: err }),
                    icon: 'images/icon-round.png',
                    timeout: 10 * 1000,
                    onClick: function () {
                        window.focus();
                        this.close();
                    }
                });
            }
        },
        'task:error': (taskId, err) => {
            let cmd = null;

            this.setState({
                commands: this.state.commands.map(c => {
                    if (c.taskId !== taskId) {
                        return c;
                    }
                    cmd = c;
                    return {
                        ...c,
                        taskId: null,
                        err: err
                    };
                }),
                runningTasks: without(this.state.runningTasks, taskId)
            });

            if (cmd && this.state.pushPermission === Push.Permission.GRANTED) {
                Push.create(cmd.title, {
                    body: i18n._('Command failed ({{err}})', { err: err }),
                    icon: 'images/icon-round.png',
                    timeout: 10 * 1000,
                    onClick: function () {
                        window.focus();
                        this.close();
                    }
                });
            }
        }
    };

    _isMounted = false;

    getInitialState() {
        let pushPermission = '';
        try {
            // Push.Permission.get() will throw an error if Push is not supported on this device
            pushPermission = Push.Permission.get();
        } catch (e) {
            // Ignore
        }

        return {
            pushPermission: pushPermission,
            commands: [],
            runningTasks: [],
            currentVersion: settings.version,
            latestVersion: settings.version,
            updateAvailable: false,
            connected: controller.connected,
            hostInformation: {
                address: '0.0.0.0',
                port: 0,
                headless: false
            }
        };
    }

    componentDidMount() {
        this._isMounted = true;
        this.updateScreenSize();
        this.addShuttleControlEvents();
        this.addControllerEvents();
        this.addResizeEventListener();

        useKeybinding(this.shuttleControlEvents);
        gamepad.on('gamepad:button', (event) => runAction({ event, shuttleControlEvents: this.shuttleControlEvents }));

        if (isElectron()) {
            this.registerIPCListeners();
            window.ipcRenderer.invoke('check-remote-status').then(result => {
                this.setState({
                    hostInformation: {
                        ...result
                    }
                });
            });
        }
    }

    componentWillUnmount() {
        this._isMounted = false;

        this.removeShuttleControlEvents();
        this.removeControllerEvents();
        this.removeResizeEventListener();

        this.runningTasks = [];
    }

    addShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.on(eventName, callback);
        });
    }

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.removeListener(eventName, callback);
        });
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    addResizeEventListener() {
        this.onResizeThrottled = _.throttle(this.updateScreenSize, 25);
        window.addEventListener('resize', this.onResizeThrottled);
    }

    removeResizeEventListener() {
        window.removeEventListener('resize', this.onResizeThrottled);
        this.onResizeThrottled = null;
    }

    toggleUpdateToast() {
        pubsub.publish('showUpdateToast');
    }

    registerIPCListeners () {
        window.ipcRenderer.on('update_available', (info) => {
            api.getShouldInstallUpdates().then((res) => {
                if (res.body) {
                    this.setState({
                        updateAvailable: true
                    });
                    pubsub.publish('showUpdateToast', info);
                }
            });
        });
    }

    updateScreenSize = () => {
        const isMobile = window.screen.width <= 639;
        this.setState({
            mobile: isMobile
        });
    };

    showToast = _.throttle(() => {
        Toaster.pop({
            msg: 'Unable to activate GrblHAL ONLY shortcut',
            type: TOASTER_WARNING,
            duration: 3000
        });
    }, 3000, { trailing: false });

    render() {
        const { updateAvailable, hostInformation, mobile } = this.state;
        return (
            <>
                <div className={styles.navBar}>
                    <div className={styles.primary}>
                        <NavLogo updateAvailable={updateAvailable} onClick={() => this.toggleUpdateToast()} />
                        <NavbarConnection
                            state={this.state}
                            actions={this.actions}
                            widgetId="connection"
                        />
                        {
                            isElectron() && <HeadlessIndicator {...hostInformation} />
                        }
                    </div>
                    { !mobile && <NavSidebar /> }
                </div>
            </>
        );
    }
}

export default withRouter(Header);
