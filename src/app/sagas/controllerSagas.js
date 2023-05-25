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
import store from 'app/store';
import reduxStore from 'app/store/redux';
import controller from 'app/lib/controller';
import _get from 'lodash/get';
import pubsub from 'pubsub-js';
import * as controllerActions from 'app/actions/controllerActions';
import manualToolChange from 'app/wizards/manualToolchange';
import semiautoToolChange from 'app/wizards/semiautoToolchange';
import automaticToolChange from 'app/wizards/automaticToolchange';
import * as connectionActions from 'app/actions/connectionActions';
import * as fileActions from 'app/actions/fileInfoActions';
import * as preferenceActions from 'app/actions/preferencesActions';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import { Toaster, TOASTER_INFO, TOASTER_UNTIL_CLOSE, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import VisualizeWorker from 'app/workers/Visualize.worker';
import { visualizeResponse, shouldVisualize, shouldVisualizeSVG } from 'app/workers/Visualize.response';
import { isLaserMode } from 'app/lib/laserMode';
import { RENDER_LOADING, RENDER_RENDERED, RENDER_NO_FILE, VISUALIZER_SECONDARY, GRBL_ACTIVE_STATE_RUN, GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_HOLD } from 'app/constants';
import isElectron from 'is-electron';
import { connectToLastDevice } from 'app/containers/Firmware/utils/index';


export function* initialize() {
    let visualizeWorker = null;
    let estimateWorker = null;
    let currentState = GRBL_ACTIVE_STATE_IDLE;
    let prevState = GRBL_ACTIVE_STATE_IDLE;
    let areStatsInitialized = false;

    /* Health check - every 3 minutes */
    setInterval(() => {
        controller.healthCheck();
    }, 1000 * 60 * 3);

    const incrementJobCounter = () => {
        let jobsFinished = store.get('workspace.jobsFinished');

        store.replace('workspace.jobsFinished', jobsFinished + 1);
    };

    const incrementJobCancelledCounter = () => {
        const jobsCancelled = store.get('workspace.jobsCancelled');

        store.replace('workspace.jobsCancelled', jobsCancelled + 1);
    };

    const incrementTimeRun = (elapsedTime) => {
        // add elapsed time to total time run
        let timeSpentRunning = store.get('workspace.timeSpentRunning');
        timeSpentRunning += elapsedTime;
        store.replace('workspace.timeSpentRunning', timeSpentRunning);

        // also add it to last element in array of job times
        let jobTimes = store.get('workspace.jobTimes');
        jobTimes[jobTimes.length - 1] += elapsedTime;
        store.replace('workspace.jobTimes', jobTimes);

        // compare last element to the longest time
        compareLongestTime(jobTimes[jobTimes.length - 1]);
    };

    const compareLongestTime = (time) => {
        let longestTimeRun = store.get('workspace.longestTimeRun');
        if (time > longestTimeRun) {
            store.replace('workspace.longestTimeRun', time);
        }
    };

    const onJobStart = () => {
        // add another index to array of job times
        let jobTimes = store.get('workspace.jobTimes');
        jobTimes.push(0);
        store.replace('workspace.jobTimes', jobTimes);
    };

    const onJobStop = (elapsedTime) => {
        if (!areStatsInitialized) {
            onJobStart();
            areStatsInitialized = true;
        }

        incrementJobCancelledCounter();
    };

    const onJobEnd = (elapsedTime) => {
        if (!areStatsInitialized) {
            onJobStart();
            areStatsInitialized = true;
        }

        incrementJobCounter();
        incrementTimeRun(elapsedTime);

        // reset to false since it's the end of the job
        areStatsInitialized = false;
    };

    controller.addListener('controller:settings', (type, settings) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_CONTROLLER_SETTINGS,
            payload: { type, settings }
        });
    });

    controller.addListener('controller:state', (type, state) => {
        // if state is the same, don't update the prev and current state
        if (currentState !== state.status.activeState) {
            prevState = currentState;
            currentState = state.status.activeState;
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
        console.log(status);
        // finished job
        if (status.finishTime > 0 && status.sent === 0 && prevState === GRBL_ACTIVE_STATE_RUN) {
            console.log('JOB FINISHED');
            onJobEnd(status.timeRunning);
        // cancelled job
        } else if (status.elapsedTime > 0 && status.sent === 0 && currentState === GRBL_ACTIVE_STATE_RUN || currentState === GRBL_ACTIVE_STATE_HOLD) {
            console.log('JOB CANCELLED');
            onJobStop(status.timeRunning);
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
        const hooks = store.get('workspace.toolChangeHooks', {});
        const toolChangeOption = store.get('workspace.toolChangeOption', 'Ignore');
        const toolChangeContext = {
            ...hooks,
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

    controller.addListener('serialport:list', (recognizedPorts, unrecognizedPorts) => {
        reduxStore.dispatch({
            type: connectionActions.LIST_PORTS,
            payload: { recognizedPorts, unrecognizedPorts }
        });
    });

    controller.addListener('gcode:toolChange', (context, comment = '',) => {
        const payload = {
            context,
            comment
        };
        const { option } = context;
        if (option === 'Manual') {
            pubsub.publish('wizard:load', {
                ...payload,
                title: 'Manual Toolchange',
                instructions: manualToolChange
            });
        } else if (option === 'Semi-Automatic') {
            pubsub.publish('wizard:load', {
                ...payload,
                title: 'Semi-Automatic Toolchange',
                instructions: semiautoToolChange
            });
        } else if (option === 'Automatic') {
            pubsub.publish('wizard:load', {
                ...payload,
                title: 'Automatic Toolchange',
                instructions: automaticToolChange
            });
        } else if (option === 'Pause') {
            const msg = 'Toolchange pause' + (comment ? ` - ${comment}` : '');
            Toaster.pop({
                msg: msg,
                type: TOASTER_INFO,
                duration: TOASTER_UNTIL_CLOSE
            });
        }
    });

    controller.addListener('gcode:load', (name, content) => {
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
        const isLaser = isLaserMode();
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
            const shouldRenderSVG = shouldVisualizeSVG();

            if (needsVisualization) {
                visualizeWorker = new VisualizeWorker();
                visualizeWorker.onmessage = visualizeResponse;
                visualizeWorker.postMessage({
                    content,
                    visualizer,
                    shouldRenderSVG
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
        /*        const xMaxAccel = _get(reduxStore.getState(), 'controller.settings.settings.$120', 500);
                const yMaxAccel = _get(reduxStore.getState(), 'controller.settings.settings.$121', 500);
                const zMaxAccel = _get(reduxStore.getState(), 'controller.settings.settings.$122', 500);
                const accelArray = [xMaxAccel * 3600, yMaxAccel * 3600, zMaxAccel * 3600];*/

        const needsVisualization = shouldVisualize();
        const shouldRenderSVG = shouldVisualizeSVG();

        if (needsVisualization) {
            visualizeWorker = new VisualizeWorker();
            visualizeWorker.onmessage = visualizeResponse;
            visualizeWorker.postMessage({
                content,
                visualizer,
                isLaser,
                shouldRenderSVG
            });
        } else {
            reduxStore.dispatch({
                type: fileActions.UPDATE_FILE_RENDER_STATE,
                payload: {
                    state: RENDER_RENDERED
                }
            });
        }
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

    pubsub.subscribe('estimate:done', (msg, data) => {
        estimateWorker.terminate();
    });

    controller.addListener('toolchange:preHookComplete', (comment = '') => {
        const onConfirmhandler = () => {
            controller.command('toolchange:post');
        };

        const content = (comment.length > 0) ? (
            <div>
                <p>
                    A toolchange command (M6) was found - click confirm to verify
                    the tool has been changed and run your post-toolchange code.
                </p>
                <p>Comment: <b>{comment}</b></p>
            </div>
        ) : 'A toolchange command (M6) was found - click confirm to verify the tool has been changed and run your post-toolchange code.';

        Confirm({
            title: 'Confirm Toolchange',
            content,
            confirmLabel: 'Confirm toolchange',
            onConfirm: onConfirmhandler
        });
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
        const { data, comment = '' } = opts;
        const msg = `A pause command (${data}) was found. Click Resume to immediately continue the job.
            If you want to perform more operations (toolchange, jog, etc),
            close the window, then press the standard Resume Job button when you're ready.`;

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

    controller.addListener('error', (error) => {
        if (isElectron() && (error.type === 'GRBL_ALARM' || error.type === 'GRBL_ERROR')) {
            window.ipcRenderer.send('logError:electron', error);
        }
        pubsub.publish('error', error);
    });

    controller.addListener('wizard:next', (stepIndex, substepIndex) => {
        pubsub.publish('wizard:next', { stepIndex, substepIndex });
    });

    controller.addListener('gcode:loaded', ({ gcode, meta }) => {
        console.log(gcode);
        console.log(meta);
    });

    yield null;
}

export function* process() {
    yield null;
}
