/* eslint-disable max-lines-per-function */
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
import React from 'react';
import _get from 'lodash/get';
import throttle from 'lodash/throttle';
import pubsub from 'pubsub-js';
import isElectron from 'is-electron';

import store from 'app/store';
import reduxStore from 'app/store/redux';
import controller from 'app/lib/controller';
import * as controllerActions from 'app/actions/controllerActions';
import manualToolChange from 'app/wizards/manualToolchange';
import semiautoToolChange from 'app/wizards/semiautoToolchange';
import automaticToolChange from 'app/wizards/automaticToolchange';
import semiautoToolchangeSecondRun from 'app/wizards/semiautoToolchangeSecondRun';
import automaticToolchangeSecondRun from 'app/wizards/automaticToolchangeSecondRun';
import * as connectionActions from 'app/actions/connectionActions';
import * as fileActions from 'app/actions/fileInfoActions';
import * as preferenceActions from 'app/actions/preferencesActions';
import * as visualizerActions from 'app/actions/visualizerActions';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import { Toaster, TOASTER_INFO, TOASTER_SUCCESS, TOASTER_UNTIL_CLOSE } from 'app/lib/toaster/ToasterLib';
import VisualizeWorker from 'app/workers/Visualize.worker';
import { shouldVisualize, visualizeResponse } from 'app/workers/Visualize.response';
import { isLaserMode } from 'app/lib/laserMode';
import {
    RENDER_LOADING,
    RENDER_RENDERED,
    VISUALIZER_SECONDARY,
    GRBL_ACTIVE_STATE_RUN,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_HOLD,
    FILE_TYPE,
    WORKSPACE_MODE,
    RENDER_NO_FILE,
    ALARM_ERROR_TYPES,
    ALARM,
    ERROR,
    JOB_TYPES,
    JOB_STATUS,
    GRBL,
} from 'app/constants';
import { connectToLastDevice } from 'app/containers/Firmware/utils/index';
import { updateWorkspaceMode } from 'app/lib/rotary';
import api from 'app/api';
import { getEstimateData, getParsedData } from '../lib/indexedDB';

export function* initialize() {
    let visualizeWorker = null;
    let estimateWorker = null;
    let currentState = GRBL_ACTIVE_STATE_IDLE;
    let prevState = GRBL_ACTIVE_STATE_IDLE;
    let errors = [];
    let finishLoad = false;

    /* Health check - every 3 minutes */
    setInterval(() => {
        controller.healthCheck();
    }, 1000 * 60 * 3);

    const updateJobStats = async(status) => {
        const controllerType = _get(reduxStore.getState(), 'controller.type');
        const port = _get(reduxStore.getState(), 'connection.port');
        const path = _get(reduxStore.getState(), 'file.path');

        try {
            let res = await api.jobStats.fetch();
            const jobStats = res.body;
            let newJobStats = jobStats;

            if (status.finishTime) {
                newJobStats.jobsFinished += 1;
            } else {
                newJobStats.jobsCancelled += 1;
            }
            newJobStats.totalRuntime += status.timeRunning;
            const job = {
                id: jobStats.jobs.length > 0 ? (jobStats.jobs.length).toString() : '0',
                type: JOB_TYPES.JOB,
                file: status.name,
                path: path,
                totalLines: status.total,
                port: port,
                controller: controllerType,
                startTime: new Date(status.startTime),
                endTime: status.finishTime === 0 ? null : new Date(status.finishTime),
                duration: status.elapsedTime,
                jobStatus: status.finishTime ? JOB_STATUS.COMPLETE : JOB_STATUS.STOPPED,
            };
            newJobStats.jobs.push(job);
            api.jobStats.update(newJobStats);
        } catch (error) {
            console.error(error);
        }
    };

    const updateMaintenanceTasks = async(status) => {
        try {
            let res = await api.maintenance.fetch();
            const tasks = res.body;
            let newTasks = tasks.map((task) => {
                let newTask = task;
                newTask.currentTime += (status.timeRunning / 1000 / 3600);
                return newTask;
            });
            api.maintenance.update(newTasks);
        } catch (error) {
            console.error(error);
        }
    };

    const shouldVisualizeSVG = () => {
        return store.get('widgets.visualizer.SVGEnabled', false);
    };

    const parseGCode = async (content, size, name, visualizer) => {
        const isLaser = isLaserMode();
        const shouldIncludeSVG = shouldVisualizeSVG();
        const accelerations = {
            xAccel: _get(reduxStore.getState(), 'controller.settings.settings.$120'),
            yAccel: _get(reduxStore.getState(), 'controller.settings.settings.$121'),
            zAccel: _get(reduxStore.getState(), 'controller.settings.settings.$122'),
        };
        const maxFeedrates = {
            xMaxFeed: Number(_get(reduxStore.getState(), 'controller.settings.settings.$110', 4000.0)),
            yMaxFeed: Number(_get(reduxStore.getState(), 'controller.settings.settings.$111', 4000.0)),
            zMaxFeed: Number(_get(reduxStore.getState(), 'controller.settings.settings.$112', 3000.0)),
        };

        // compare previous file data to see if it's a new file and we need to reparse
        let isNewFile = true;
        const fileData = _get(reduxStore.getState(), 'file');
        const { content: prevContent, size: prevSize, name: prevName } = fileData;
        if (content === prevContent && size === prevSize && name === prevName) {
            isNewFile = false;
        }

        if (visualizer === VISUALIZER_SECONDARY) {
            reduxStore.dispatch({
                type: fileActions.UPDATE_FILE_RENDER_STATE,
                payload: {
                    state: RENDER_NO_FILE
                }
            });
            setTimeout(() => {
                const renderState = _get(reduxStore.getState(), 'file.renderState');
                if (renderState === RENDER_NO_FILE) {
                    reduxStore.dispatch({
                        type: fileActions.UPDATE_FILE_RENDER_STATE,
                        payload: {
                            state: RENDER_LOADING
                        }
                    });
                }
            }, 1000);

            const needsVisualization = shouldVisualize();

            if (needsVisualization) {
                visualizeWorker = new VisualizeWorker();
                visualizeWorker.onmessage = visualizeResponse;
                await getParsedData().then((value) => {
                    const parsedData = value;
                    visualizeWorker.postMessage({
                        content,
                        visualizer,
                        parsedData,
                        isNewFile,
                        accelerations,
                        maxFeedrates
                    });
                });
            } else {
                reduxStore.dispatch({
                    type: fileActions.UPDATE_FILE_RENDER_STATE,
                    payload: {
                        state: RENDER_RENDERED
                    }
                });
            }

            return;
        }

        // Basic file content
        reduxStore.dispatch({
            type: fileActions.UPDATE_FILE_CONTENT,
            payload: {
                content,
                size,
                name,
            }
        });
        // sending gcode data to the visualizer
        // so it can save it and give it to the normal or svg visualizer
        pubsub.publish('file:content', content, size, name);
        // Processing started for gcodeProcessor
        reduxStore.dispatch({
            type: fileActions.UPDATE_FILE_PROCESSING,
            payload: {
                value: true
            }
        });
        reduxStore.dispatch({
            type: fileActions.UPDATE_FILE_RENDER_STATE,
            payload: {
                state: RENDER_NO_FILE
            }
        });
        setTimeout(() => {
            const renderState = _get(reduxStore.getState(), 'file.renderState');
            if (renderState === RENDER_NO_FILE) {
                reduxStore.dispatch({
                    type: fileActions.UPDATE_FILE_RENDER_STATE,
                    payload: {
                        state: RENDER_LOADING
                    }
                });
            }
        }, 1000);

        const needsVisualization = shouldVisualize();

        visualizeWorker = new VisualizeWorker();
        visualizeWorker.onmessage = visualizeResponse;
        await getParsedData().then((value) => {
            const parsedData = value;
            visualizeWorker.postMessage({
                content,
                visualizer,
                isLaser,
                shouldIncludeSVG,
                needsVisualization,
                parsedData,
                isNewFile,
                accelerations,
                maxFeedrates
            });
        });
    };

    const updateAlarmsErrors = async (error) => {
        try {
            let res = await api.alarmList.fetch();
            const alarmList = res.body;

            const alarmError = {
                id: alarmList.list.length > 0 ? (alarmList.list.length).toString() : '0',
                type: error.type.includes('ALARM') ? ALARM : ERROR,
                source: error.origin,
                time: new Date(),
                CODE: error.code,
                MESSAGE: error.description,
                lineNumber: error.lineNumber,
                line: error.line,
                controller: error.controller,
            };
            alarmList.list.push(alarmError);
            api.alarmList.update(alarmList);
        } catch (error) {
            console.error(error);
        }
    };

    controller.addListener('controller:settings', (type, settings) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_CONTROLLER_SETTINGS,
            payload: { type, settings }
        });
    });

    controller.addListener('controller:state', (type, state, tool) => {
        // if state is the same, don't update the prev and current state
        if (currentState !== state.status.activeState) {
            prevState = currentState;
            currentState = state.status.activeState;
        }
        if (tool) {
            state.parserstate.modal.tool = tool;
        }
        reduxStore.dispatch({
            type: controllerActions.UPDATE_CONTROLLER_STATE,
            payload: { type, state }
        });
    });

    controller.addListener('feeder:status', (status) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_FEEDER_STATUS,
            payload: { status },
        });
    });

    controller.addListener('sender:status', (status) => {
        // finished job or cancelled job
        // because elapsed time and time running only update on sender.next(), they may not be entirely accurate for stopped jobs
        if ((status.finishTime > 0 && status.sent === 0 && prevState === GRBL_ACTIVE_STATE_RUN) ||
            (status.elapsedTime > 0 && status.sent === 0 && (currentState === GRBL_ACTIVE_STATE_RUN || currentState === GRBL_ACTIVE_STATE_HOLD || (errors.length > 0 && prevState === GRBL_ACTIVE_STATE_RUN)))) {
            updateJobStats(status);
            updateMaintenanceTasks(status);
            reduxStore.dispatch({ type: visualizerActions.UPDATE_JOB_OVERRIDES, payload: { isChecked: false, toggleStatus: 'jobStatus' } });
            pubsub.publish('job:end', { status, errors });
            errors = [];
        }

        reduxStore.dispatch({
            type: controllerActions.UPDATE_SENDER_STATUS,
            payload: { status },
        });
    });

    controller.addListener('workflow:state', (state) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_WORKFLOW_STATE,
            payload: { state },
        });
    });

    controller.addListener('serialport:open', (options) => {
        if (isElectron()) {
            window.ipcRenderer.send('reconnect-main', options);
        }

        const machineProfile = store.get('workspace.machineProfile');
        const showLineWarnings = store.get('widgets.visualizer.showLineWarnings');
        const delay = store.get('widgets.spindle.delay');
        // Reset homing run flag to prevent rapid position without running homing
        reduxStore.dispatch({
            type: controllerActions.RESET_HOMING,
        });

        if (machineProfile) {
            controller.command('machineprofile:load', machineProfile);
        }

        if (showLineWarnings) {
            controller.command('settings:updated', { showLineWarnings });
        }

        if (delay !== undefined) {
            controller.command('settings:updated', { spindleDelay: delay });
        }
        const hooks = store.get('workspace.toolChangeHooks', {});
        const toolChangeOption = store.get('workspace.toolChangeOption', 'Ignore');
        const toolChangeConfig = store.get('workspace.toolChange', {});
        const toolChangeContext = {
            ...hooks,
            ...toolChangeConfig,
            toolChangeOption
        };
        controller.command('toolchange:context', toolChangeContext);

        reduxStore.dispatch({
            type: connectionActions.OPEN_CONNECTION,
            payload: { options }
        });

        pubsub.publish('machine:connected');
    });

    controller.addListener('serialport:close', (options, received) => {
        // Reset homing run flag to prevent rapid position without running homing
        reduxStore.dispatch({
            type: controllerActions.RESET_HOMING,
        });
        reduxStore.dispatch({
            type: connectionActions.CLOSE_CONNECTION,
            payload: { options }
        });

        pubsub.publish('machine:disconnected');

        // if the connection was closed unexpectedly (not by the user),
        // the number of lines sent will be defined.
        // create a pop up so the user can connect to the last active port
        // and resume from the last line
        if (received) {
            const homingEnabled = _get(reduxStore.getState(), 'controller.settings.settings.$22');
            const msg = homingEnabled === '1'
                ? 'The machine connection has been disrupted. To attempt to reconnect to the last active port, ' +
                'home, and choose which line to continue from, press Resume.'
                : 'The machine connection has been disrupted. To attempt to reconnect to the last active port, ' +
                'press Resume. After that, you can set your Workspace 0 and use the Start From Line function to continue the job. ' +
                'Suggested line to start from: ' +
                received;

            const content = (
                <div>
                    <p>
                        {msg}
                    </p>
                </div>
            );

            Confirm({
                title: 'Port Disconnected',
                content,
                confirmLabel: 'Resume',
                cancelLabel: 'Close',
                onConfirm: () => {
                    connectToLastDevice(() => {
                        // prompt recovery, either with homing or a prompt to start from line
                        pubsub.publish('disconnect:recovery', received, homingEnabled);
                    });
                }
            });
        }
    });

    controller.addListener('serialport:list', (recognizedPorts, unrecognizedPorts, networkPorts) => {
        reduxStore.dispatch({
            type: connectionActions.LIST_PORTS,
            payload: { recognizedPorts, unrecognizedPorts, networkPorts }
        });
    });

    controller.addListener('gcode:toolChange', (context, comment = '',) => {
        const payload = {
            context,
            comment
        };

        const { option, count } = context;
        if (option === 'Pause') {
            const msg = 'Toolchange pause' + (comment ? ` - ${comment}` : '');
            Toaster.pop({
                msg: msg,
                type: TOASTER_INFO,
                duration: TOASTER_UNTIL_CLOSE
            });
        } else {
            let title, instructions;

            if (option === 'Standard Re-zero') {
                title = 'Standard Re-zero Tool Change';
                instructions = manualToolChange;
            } else if (option === 'Flexible Re-zero') {
                title = 'Flexible Re-zero Tool Change';
                instructions = (count > 1) ? semiautoToolchangeSecondRun : semiautoToolChange;
            } else if (option === 'Fixed Tool Sensor') {
                title = 'Fixed Tool Sensor Tool Change';
                instructions = (count > 1) ? automaticToolchangeSecondRun : automaticToolChange;
            } else {
                console.error('Invalid toolchange option passed');
                return;
            }

            // Run start block on idle if exists
            if (instructions.onStart) {
                const onStart = instructions.onStart();
                controller.command('wizard:start', onStart);
            }

            pubsub.publish('wizard:load', {
                ...payload,
                title,
                instructions
            });
        }
    });

    controller.addListener('toolchange:preHookComplete', (comment = '') => {
        // const onConfirmhandler = () => {
        controller.command('toolchange:post');
        // };

        // const content = (comment.length > 0)
        //     ? <div><p>A toolchange command (M6) was found - click confirm to verify the tool has been changed and run your post-toolchange code.</p><p>Comment: <b>{comment}</b></p></div>
        //     : 'A toolchange command (M6) was found - click confirm to verify the tool has been changed and run your post-toolchange code.';

        // Confirm({
        //     title: 'Confirm Toolchange',
        //     content,
        //     confirmLabel: 'Confirm toolchange',
        //     onConfirm: onConfirmhandler
        // });
    });

    controller.addListener('gcode:load', (name, content) => {
        finishLoad = false;
        const size = new Blob([content]).size;
        reduxStore.dispatch({
            type: fileActions.UPDATE_FILE_CONTENT,
            payload: {
                name,
                content,
                size
            }
        });
    });

    controller.addListener('file:load', (content, size, name, visualizer) => {
        parseGCode(content, size, name, visualizer);
    });

    controller.addListener('gcode:unload', () => {
        reduxStore.dispatch({
            type: fileActions.UNLOAD_FILE_INFO,
            payload: {}
        });
    });

    controller.addListener('electronErrors:errorList', (errorList) => {
        store.set('electron-error-list', errorList);
    });

    controller.addListener('ip:list', (ipList) => {
        reduxStore.dispatch({
            type: preferenceActions.SET_IP_LIST,
            payload: ipList,
        });
    });

    controller.addListener('requestEstimateData', () => {
        if (finishLoad) {
            finishLoad = false;
            getEstimateData().then((value) => {
                controller.command('updateEstimateData', value);
            });
        }
    });

    // Need this to handle unload when machine not connected since controller event isn't sent
    pubsub.subscribe('gcode:unload', () => {
        reduxStore.dispatch({
            type: fileActions.UNLOAD_FILE_INFO,
            payload: {}
        });
    });

    pubsub.subscribe('file:load', (msg, data) => {
        visualizeWorker.terminate();
    });

    pubsub.subscribe('parsedData:stored', () => {
        finishLoad = true;
        getEstimateData().then((value) => {
            controller.command('updateEstimateData', value);
        });
    });

    // for when you don't want to send file to backend
    pubsub.subscribe('visualizer:load', (_, { content, size, name, visualizer }) => {
        parseGCode(content, size, name, visualizer);
    });

    pubsub.subscribe('estimate:done', (msg, data) => {
        estimateWorker.terminate();
    });

    pubsub.subscribe('reparseGCode', (msg, content, size, name, visualizer) => {
        parseGCode(content, size, name, visualizer);
    });


    controller.addListener('workflow:pause', (opts) => {
        const { data } = opts;
        Toaster.pop({
            msg: `'${data}' pause command found in file - press "Resume Job" to continue running.`,
            type: TOASTER_INFO,
            duration: TOASTER_UNTIL_CLOSE
        });
    });

    controller.addListener('sender:M0M1', (opts) => {
        const { comment = '' } = opts;
        const msg = 'Hit \‘Close Window\‘ if you want to do a tool change, jog, set a new zero, or perform any other operation then hit the standard \‘Resume Job\’ button to keep cutting when you\’re ready.';

        const content = (comment.length > 0)
            ? <div><p>{msg}</p><p>Comment: <b>{comment}</b></p></div>
            : msg;

        Confirm({
            title: 'M0/M1 Pause',
            content,
            confirmLabel: 'Resume Job',
            cancelLabel: 'Close Window',
            onConfirm: () => {
                controller.command('gcode:resume');
            }
        });
    });

    controller.addListener('outline:start', () => {
        Toaster.clear();
        Toaster.pop({
            type: TOASTER_SUCCESS,
            msg: 'Running file outline'
        });
    });

    controller.addListener('homing:flag', (flag) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_HOMING_FLAG,
            payload: {
                homingFlag: flag
            }
        });
        pubsub.publish('softlimits:check');
    });

    controller.addListener('firmware:ready', (status) => {
        pubsub.publish('firmware:update', status);
    });

    controller.addListener('error', (error, wasRunning) => {
        const homingEnabled = _get(reduxStore.getState(), 'controller.settings.settings.$22');

        if (ALARM_ERROR_TYPES.includes(error.type)) {
            updateAlarmsErrors(error);
        }
        // if (isElectron() && (alarmReg.test(error.type) || errorReg.test(error.type))) {
        //     window.ipcRenderer.send('logError:electron', error);
        // }
        pubsub.publish('error', error);

        // set need recovery for start from line when alarm happens
        if (error.type === ALARM && wasRunning) {
            pubsub.publish('disconnect:recovery', error.lineNumber, homingEnabled);
        }
    });

    controller.addListener('wizard:next', (stepIndex, substepIndex) => {
        pubsub.publish('wizard:next', { stepIndex, substepIndex });
    });

    controller.addListener('filetype', (type) => {
        if (type === FILE_TYPE.ROTARY) {
            const workspaceMode = store.get('workspace.mode');

            if (workspaceMode !== WORKSPACE_MODE.ROTARY) {
                Confirm({
                    title: 'Rotary File Loaded',
                    content: 'G-Code contains A-axis command, please enable Rotary mode if your machine is equipped with a rotary axis unit.',
                    confirmLabel: 'Enable Rotary Mode',
                    cancelLabel: 'Close',
                    onConfirm: () => {
                        updateWorkspaceMode(WORKSPACE_MODE.ROTARY);
                    }
                });
            }
        }

        if (type === FILE_TYPE.FOUR_AXIS && controller.type === GRBL) {
            Confirm({
                title: '4 Axis File Loaded',
                content: 'G-Code contains 4 simultaneous axis commands which are not supported at this time and cannot be run.',
                confirmLabel: null,
                cancelLabel: 'Close',
            });
        }
    });


    controller.addListener('connection:new', (content) => {
        pubsub.publish('store:update', content);
    });

    controller.addListener('gcode_error', throttle((error) => {
        errors.push(error);
    }, 250, { trailing: false }));

    controller.addListener('settings:description', (data) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_SETTINGS_DESCRIPTIONS,
            payload: {
                descriptions: data
            }
        });
    });

    controller.addListener('settings:alarm', (data) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_ALARM_DESCRIPTIONS,
            payload: {
                alarms: data
            }
        });
    });

    controller.addListener('settings:group', (data) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_GROUPS,
            payload: {
                groups: data
            }
        });
    });

    controller.addListener('networkScan:status', (isScanning) => {
        reduxStore.dispatch({
            type: connectionActions.SCAN_NETWORK,
            payload: {
                isScanning: isScanning
            }
        });
        if (!isScanning) {
            pubsub.publish('networkScan:finished');
        }
    });

    controller.addListener('spindle:add', (spindle) => {
        if (Object.hasOwn(spindle, 'id')) {
            reduxStore.dispatch({
                type: controllerActions.ADD_SPINDLE,
                payload: spindle
            });
        }
    });

    controller.addListener('job:start', () => {
        errors = [];
    });


    yield null;
}

export function* process() {
    yield null;
}
