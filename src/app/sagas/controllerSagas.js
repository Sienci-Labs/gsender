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

import store from 'app/store';
import reduxStore from 'app/store/redux';
import controller from 'app/lib/controller';
import pubsub from 'pubsub-js';
import * as controllerActions from 'app/actions/controllerActions';
import * as connectionActions from 'app/actions/connectionActions';
import * as fileActions from 'app/actions/fileInfoActions';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import { Toaster, TOASTER_INFO, TOASTER_UNTIL_CLOSE, TOASTER_SUCCESS } from 'app/lib/toaster/ToasterLib';
import EstimateWorker from 'app/workers/Estimate.worker';
import VisualizeWorker from 'app/workers/Visualize.worker';
import { estimateResponseHandler } from 'app/workers/Estimate.response';
import { visualizeResponse, shouldVisualize } from 'app/workers/Visualize.response';
import { RENDER_LOADING, RENDER_RENDERED, VISUALIZER_SECONDARY } from 'app/constants';

export function* initialize() {
    /* Health check - every 3 minutes */
    setInterval(() => {
        controller.healthCheck();
    }, 1000 * 60 * 3);

    controller.addListener('controller:settings', (type, settings) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_CONTROLLER_SETTINGS,
            payload: { type, settings }
        });
    });

    controller.addListener('controller:state', (type, state) => {
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
        try {
            reduxStore.dispatch({
                type: controllerActions.UPDATE_SENDER_STATUS,
                payload: { status },
            });
        } catch (e) {
            console.log(e);
        }
    });

    controller.addListener('workflow:state', (state) => {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_WORKFLOW_STATE,
            payload: { state },
        });
    });

    controller.addListener('serialport:open', (options) => {
        const machineProfile = store.get('workspace.machineProfile');
        const showLineWarnings = store.get('widgets.visualizer.showLineWarnings');

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
    });

    controller.addListener('serialport:close', (options) => {
        reduxStore.dispatch({
            type: connectionActions.CLOSE_CONNECTION,
            payload: { options }
        });
    });

    controller.addListener('serialport:list', (recognizedPorts, unrecognizedPorts) => {
        reduxStore.dispatch({
            type: connectionActions.LIST_PORTS,
            payload: { recognizedPorts, unrecognizedPorts }
        });
    });

    controller.addListener('gcode:toolChange', (context) => {
        pubsub.publish('gcode:toolChange', context);
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
        if (visualizer === VISUALIZER_SECONDARY) {
            reduxStore.dispatch({
                type: fileActions.UPDATE_FILE_RENDER_STATE,
                payload: {
                    state: RENDER_LOADING
                }
            });

            const needsVisualization = shouldVisualize();

            if (needsVisualization) {
                const visualizeWorker = new VisualizeWorker();
                visualizeWorker.onmessage = visualizeResponse;
                visualizeWorker.postMessage({
                    content,
                    visualizer
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
                state: RENDER_LOADING
            }
        });

        const estimateWorker = new EstimateWorker();
        estimateWorker.onmessage = estimateResponseHandler;
        estimateWorker.postMessage({
            content,
            name,
            size
        });

        const needsVisualization = shouldVisualize();

        if (needsVisualization) {
            const visualizeWorker = new VisualizeWorker();
            visualizeWorker.onmessage = visualizeResponse;
            visualizeWorker.postMessage({
                content,
                visualizer
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

    // Need this to handle unload when machine not connected since controller event isn't sent
    pubsub.subscribe('gcode:unload', () => {
        reduxStore.dispatch({
            type: fileActions.UNLOAD_FILE_INFO,
            payload: {}
        });
    });

    controller.addListener('toolchange:preHookComplete', () => {
        const onConfirmhandler = () => {
            controller.command('toolchange:post');
        };

        Confirm({
            title: 'Confirm Toolchange',
            content: 'A toolchange command (M6) was found - click confirm to verify the tool has been changed and run your post-toolchange code.',
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
    });

    yield null;
}

export function* process() {
    yield null;
}
