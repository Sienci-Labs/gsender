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
import _get from 'lodash/get';
import _throttle from 'lodash/throttle';
import pubsub from 'pubsub-js';
import isElectron from 'is-electron';

import store from 'app/store';
import { store as reduxStore } from 'app/store/redux';
import controller from 'app/lib/controller';
import manualToolChange from 'app/wizards/manualToolchange';
import semiautoToolChange from 'app/wizards/semiautoToolchange';
import automaticToolChange from 'app/wizards/automaticToolchange';
import semiautoToolchangeSecondRun from 'app/wizards/semiautoToolchangeSecondRun';
import automaticToolchangeSecondRun from 'app/wizards/automaticToolchangeSecondRun';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
// TODO: add worker types
// @ts-ignore
import VisualizeWorker from 'app/workers/Visualize.worker';
import {
    shouldVisualize,
    visualizeResponse,
} from 'app/workers/Visualize.response';
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
    LIGHTWEIGHT_OPTIONS,
} from 'app/constants';
import {
    closeConnection,
    openConnection,
    scanNetwork,
} from '../slices/connection.slice';
import { listPorts } from '../slices/connection.slice';
import {
    resetHoming,
    updateControllerSettings,
    updateControllerState,
    updateFeederStatus,
    updateWorkflowState,
    addSpindle,
    updateAlarmDescriptions,
    updateSettingsDescriptions,
    updateHomingFlag,
    updateSenderStatus,
    updateControllerType,
} from '../slices/controller.slice';
import {
    FILE_TYPE_T,
    PortInfo,
    SerialPortOptions,
    WORKFLOW_STATES_T,
} from '../../definitions';
import { ControllerSettings } from '../../definitions';
import { FeederStatus } from 'app/lib/definitions/sender_feeder';
import {
    EEPROMDescriptions,
    FIRMWARE_TYPES_T,
    MachineProfile,
} from 'app/definitions/firmware';
import { BasicObject, GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import { TOOL } from 'app/lib/definitions/gcode_virtualization';
import { WORKSPACE_MODE_T } from 'app/workspace/definitions';
import { connectToLastDevice } from 'app/features/Firmware/utils/index';
import { updateWorkspaceMode } from 'app/lib/rotary';
import api from 'app/api';
import {
    unloadFileInfo,
    updateFileContent,
    updateFileProcessing,
    updateFileRenderState,
} from '../slices/fileInfo.slice';
import { getEstimateData, getParsedData } from 'app/lib/indexedDB';
import { setIpList } from '../slices/preferences.slice';
import { updateJobOverrides } from '../slices/visualizer.slice';
import { toast } from 'app/lib/toaster';
import { Job } from 'app/features/Stats/utils/StatContext';
import { updateToolchangeContext } from 'app/features/Helper/Wizard.tsx';

export function* initialize(): Generator<any, void, any> {
    // let visualizeWorker: typeof VisualizeWorker | null = null;
    // let estimateWorker: EstimateWorker | null = null;
    let currentState: GRBL_ACTIVE_STATES_T = GRBL_ACTIVE_STATE_IDLE;
    let prevState: GRBL_ACTIVE_STATES_T = GRBL_ACTIVE_STATE_IDLE;
    let errors: any[] = [];
    let finishLoad = false;

    /* Health check - every 3 minutes */
    setInterval(
        () => {
            controller.healthCheck();
        },
        1000 * 60 * 3,
    );

    const updateJobStats = async (status: any) => {
        const controllerType = _get(reduxStore.getState(), 'controller.type');
        const port = _get(reduxStore.getState(), 'connection.port');
        const path = _get(reduxStore.getState(), 'file.path');

        try {
            let res = await api.jobStats.fetch();
            const jobStats = res.data;
            let newJobStats = jobStats;

            if (status.finishTime) {
                newJobStats.jobsFinished += 1;
            } else {
                newJobStats.jobsCancelled += 1;
            }
            newJobStats.totalRuntime += status.timeRunning;
            const job: Job = {
                id:
                    jobStats.jobs.length > 0
                        ? jobStats.jobs.length.toString()
                        : '0',
                type: JOB_TYPES.JOB,
                file: status.name,
                path: path,
                totalLines: status.total,
                port: port,
                controller: controllerType,
                startTime: new Date(status.startTime),
                endTime:
                    status.finishTime === 0
                        ? null
                        : new Date(status.finishTime),
                duration: status.elapsedTime,
                jobStatus: status.finishTime
                    ? JOB_STATUS.COMPLETE
                    : JOB_STATUS.STOPPED,
            };
            newJobStats.jobs.push(job);
            api.jobStats.update(newJobStats);
            pubsub.publish('lastJob', job);
        } catch (error) {
            console.error(error);
        }
    };

    const updateMaintenanceTasks = async (status: any) => {
        try {
            let res = await api.maintenance.fetch();
            const tasks = res.data;
            let newTasks = tasks.map((task: any) => {
                let newTask = task;
                newTask.currentTime += status.timeRunning / 1000 / 3600;
                return newTask;
            });
            api.maintenance.update(newTasks);
        } catch (error) {
            console.error(error);
        }
    };

    const shouldVisualizeSVG = () => {
        return (
            store.get(
                'widgets.visualizer.liteOption',
                LIGHTWEIGHT_OPTIONS.LIGHT,
            ) === LIGHTWEIGHT_OPTIONS.LIGHT
        );
    };

    const parseGCode = async (
        content: string,
        size: number,
        name: string,
        visualizer: string,
    ) => {
        const reduxState = reduxStore.getState();
        const isLaser = isLaserMode();
        const shouldIncludeSVG = shouldVisualizeSVG();
        const accelerations = {
            xAccel: _get(reduxState, 'controller.settings.settings.$120'),
            yAccel: _get(reduxState, 'controller.settings.settings.$121'),
            zAccel: _get(reduxState, 'controller.settings.settings.$122'),
        };
        const maxFeedrates = {
            xMaxFeed: Number(
                _get(reduxState, 'controller.settings.settings.$110', 4000.0),
            ),
            yMaxFeed: Number(
                _get(reduxState, 'controller.settings.settings.$111', 4000.0),
            ),
            zMaxFeed: Number(
                _get(reduxState, 'controller.settings.settings.$112', 3000.0),
            ),
        };

        // compare previous file data to see if it's a new file and we need to reparse
        let isNewFile = true;
        const fileData = _get(reduxState, 'file');
        const {
            content: prevContent,
            size: prevSize,
            name: prevName,
        } = fileData;
        if (content === prevContent && size === prevSize && name === prevName) {
            isNewFile = false;
        }

        if (visualizer === VISUALIZER_SECONDARY) {
            reduxStore.dispatch(
                updateFileRenderState({ renderState: RENDER_NO_FILE }),
            );
            setTimeout(() => {
                const renderState = _get(reduxState, 'file.renderState');
                if (renderState === RENDER_NO_FILE) {
                    reduxStore.dispatch(
                        updateFileRenderState({ renderState: RENDER_LOADING }),
                    );
                }
            }, 1000);

            const needsVisualization = shouldVisualize();

            if (needsVisualization) {
                // visualizeWorker = new VisualizeWorker();
                const visualizeWorker = new Worker(
                    new URL(
                        '../../../workers/Visualize.worker.ts',
                        import.meta.url,
                    ),
                    { type: 'module' },
                );
                visualizeWorker.onmessage = visualizeResponse;
                await getParsedData().then((value) => {
                    const parsedData = value;
                    visualizeWorker.postMessage({
                        content,
                        visualizer,
                        parsedData,
                        isNewFile,
                        accelerations,
                        maxFeedrates,
                    });
                });
            } else {
                reduxStore.dispatch(
                    updateFileRenderState({
                        renderState: RENDER_RENDERED,
                    }),
                );
            }

            return;
        }

        // Basic file content
        reduxStore.dispatch(updateFileContent({ content, size, name }));
        // sending gcode data to the visualizer
        // so it can save it and give it to the normal or svg visualizer

        // TODO: ensure this is the correct way to do it, try to avoid pubsub as it's deprecated
        pubsub.publish('file:content', { content, size, name });
        // Processing started for gcodeProcessor
        reduxStore.dispatch(updateFileProcessing({ fileProcessing: true }));
        reduxStore.dispatch(
            updateFileRenderState({ renderState: RENDER_NO_FILE }),
        );
        setTimeout(() => {
            const renderState = _get(reduxStore.getState(), 'file.renderState');
            if (renderState === RENDER_NO_FILE) {
                reduxStore.dispatch(
                    updateFileRenderState({
                        renderState: RENDER_LOADING,
                    }),
                );
            }
        }, 1000);

        const needsVisualization = shouldVisualize();

        // visualizeWorker = new VisualizeWorker();
        const visualizeWorker = new Worker(
            new URL('../../../workers/Visualize.worker.ts', import.meta.url),
            { type: 'module' },
        );
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
                maxFeedrates,
            });
        });
    };

    const updateAlarmsErrors = async (error: any) => {
        try {
            let res = await api.alarmList.fetch();
            const alarmList = res.data;

            const alarmError = {
                id:
                    alarmList.list.length > 0
                        ? alarmList.list.length.toString()
                        : '0',
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

    controller.addListener(
        'controller:settings',
        (type: string, settings: ControllerSettings) => {
            reduxStore.dispatch(
                updateControllerSettings({
                    type,
                    settings,
                }),
            );
        },
    );

    controller.addListener(
        'controller:state',
        (type: string, state: any, tool: TOOL) => {
            // if state is the same, don't update the prev and current state
            if (currentState !== state.status.activeState) {
                prevState = currentState;
                currentState = state.status.activeState;
            }
            if (tool) {
                state.parserstate.modal.tool = tool;
            }
            reduxStore.dispatch(updateControllerState({ type, state }));
        },
    );

    controller.addListener('feeder:status', (status: FeederStatus) => {
        reduxStore.dispatch(updateFeederStatus({ status }));
    });

    controller.addListener('sender:status', (status: any) => {
        // finished job or cancelled job
        // because elapsed time and time running only update on sender.next(), they may not be entirely accurate for stopped jobs
        if (
            (status.finishTime > 0 &&
                status.sent === 0 &&
                prevState === GRBL_ACTIVE_STATE_RUN) ||
            (status.elapsedTime > 0 &&
                status.sent === 0 &&
                (currentState === GRBL_ACTIVE_STATE_RUN ||
                    currentState === GRBL_ACTIVE_STATE_HOLD ||
                    (errors.length > 0 && prevState === GRBL_ACTIVE_STATE_RUN)))
        ) {
            updateJobStats(status);
            updateMaintenanceTasks(status);
            reduxStore.dispatch(
                updateJobOverrides({
                    isChecked: false,
                    toggleStatus: 'jobStatus',
                }),
            );
            pubsub.publish('job:end', { status, errors });
            errors = [];
        }

        reduxStore.dispatch(updateSenderStatus({ status }));
    });

    controller.addListener('workflow:state', (state: WORKFLOW_STATES_T) => {
        reduxStore.dispatch(updateWorkflowState({ state }));
    });

    controller.addListener(
        'serialport:open',
        (options: {
            port: string;
            baudrate: string;
            controllerType: string;
            inuse: boolean;
        }) => {
            if (isElectron()) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('reconnect-main', options);
            }

            reduxStore.dispatch(
                openConnection({
                    port: options.port,
                    baudrate: options.baudrate,
                    isConnected: true,
                }),
            );
            reduxStore.dispatch(
                updateControllerType({ type: options.controllerType }),
            );
        },
    );

    controller.addListener(
        'serialport:openController',
        (controllerType: FIRMWARE_TYPES_T) => {
            console.log('this is never called');
            const machineProfile: MachineProfile = store.get(
                'workspace.machineProfile',
            );
            const showLineWarnings: boolean = store.get(
                'widgets.visualizer.showLineWarnings',
            );
            const delay: number = store.get('widgets.spindle.delay');
            // Reset homing run flag to prevent rapid position without running homing
            reduxStore.dispatch(resetHoming());

            if (machineProfile) {
                controller.command('machineprofile:load', machineProfile);
            }

            if (showLineWarnings) {
                controller.command('settings:updated', { showLineWarnings });
            }

            if (delay !== undefined) {
                controller.command('settings:updated', { spindleDelay: delay });
            }

            updateToolchangeContext();

            store.set('widgets.connection.controller.type', controllerType);
            reduxStore.dispatch(updateControllerType({ type: controllerType }));

            pubsub.publish('machine:connected');
        },
    );

    controller.addListener(
        'serialport:close',
        (options: SerialPortOptions, _received: number) => {
            // Reset homing run flag to prevent rapid position without running homing
            reduxStore.dispatch(resetHoming());
            reduxStore.dispatch(closeConnection({ port: options.port }));

            pubsub.publish('machine:disconnected');
        },
    );

    controller.addListener(
        'serialport:closeController',
        (_options: SerialPortOptions, received: number) => {
            // if the connection was closed unexpectedly (not by the user),
            // the number of lines sent will be defined.
            // create a pop up so the user can connect to the last active port
            // and resume from the last line
            if (received) {
                const homingEnabled: string = _get(
                    reduxStore.getState(),
                    'controller.settings.settings.$22',
                );
                const msg =
                    homingEnabled === '1'
                        ? 'The machine connection has been disrupted. To attempt to reconnect to the last active port, ' +
                          'home, and choose which line to continue from, press Resume.'
                        : 'The machine connection has been disrupted. To attempt to reconnect to the last active port, ' +
                          'press Resume. After that, you can set your Workspace 0 and use the Start From Line function to continue the job. ' +
                          'Suggested line to start from: ' +
                          received;

                const content = (
                    <div>
                        <p>{msg}</p>
                    </div>
                );

                Confirm({
                    title: 'Port Disconnected',
                    content,
                    confirmLabel: 'Resume',
                    cancelLabel: 'Close',
                    onConfirm: () => {
                        // TODO: add this back in
                        connectToLastDevice(() => {
                            // prompt recovery, either with homing or a prompt to start from line
                            pubsub.publish('disconnect:recovery', {
                                received,
                                homingEnabled,
                            });
                        });
                    },
                });
            }
        },
    );

    controller.addListener(
        'serialport:list',
        (
            ports: PortInfo[],
            unrecognizedPorts: PortInfo[],
            networkPorts: PortInfo[],
        ) => {
            reduxStore.dispatch(
                listPorts({ ports, unrecognizedPorts, networkPorts }),
            );
        },
    );

    controller.addListener('gcode:toolChange', (context: any, comment = '') => {
        const payload = {
            context,
            comment,
        };
        const skipDialog = store.get('workspace.toolChange.skipDialog', false);

        const { option, count } = context;
        if (option === 'Pause') {
            const msg = 'Toolchange pause' + (comment ? ` - ${comment}` : '');
            if (!skipDialog) {
                toast.info(msg);
            }
        } else {
            let title, instructions;

            if (option === 'Standard Re-zero') {
                title = 'Standard Re-zero Tool Change';
                instructions = manualToolChange;
            } else if (option === 'Flexible Re-zero') {
                title = 'Flexible Re-zero Tool Change';
                instructions =
                    count > 1
                        ? semiautoToolchangeSecondRun
                        : semiautoToolChange;
            } else if (option === 'Fixed Tool Sensor') {
                title = 'Fixed Tool Sensor Tool Change';
                instructions =
                    count > 1
                        ? automaticToolchangeSecondRun
                        : automaticToolChange;
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
                instructions,
            });
        }
    });

    controller.addListener('toolchange:preHookComplete', (comment = '') => {
        const onConfirmhandler = () => {
            controller.command('toolchange:post');
        };

        const content =
            comment.length > 0 ? (
                <div>
                    <p>
                        A toolchange command (M6) was found - click confirm to
                        verify the tool has been changed and run your
                        post-toolchange code.
                    </p>
                    <p>
                        Comment: <b>{comment}</b>
                    </p>
                </div>
            ) : (
                'A toolchange command (M6) was found - click confirm to verify the tool has been changed and run your post-toolchange code.'
            );

        Confirm({
            title: 'Confirm Toolchange',
            content,
            confirmLabel: 'Confirm toolchange',
            onConfirm: onConfirmhandler,
        });
    });

    controller.addListener('gcode:load', (name: string, content: string) => {
        finishLoad = false;
        const size = new Blob([content]).size;
        reduxStore.dispatch(updateFileContent({ content, size, name }));
    });

    controller.addListener(
        'file:load',
        (content: string, size: number, name: string, visualizer: string) => {
            parseGCode(content, size, name, visualizer);
        },
    );

    controller.addListener('gcode:unload', () => {
        reduxStore.dispatch(unloadFileInfo());
    });

    controller.addListener(
        'electronErrors:errorList',
        (errorList: string[]) => {
            store.set('electron-error-list', errorList);
        },
    );

    controller.addListener('ip:list', (ipList: string[]) => {
        reduxStore.dispatch(setIpList(ipList));
    });

    controller.addListener('requestEstimateData', () => {
        if (finishLoad) {
            finishLoad = false;
            getEstimateData().then((value) => {
                controller.command('updateEstimateData', value);
            });
        }
    });

    // // Need this to handle unload when machine not connected since controller event isn't sent
    pubsub.subscribe('gcode:unload', () => {
        reduxStore.dispatch(unloadFileInfo());
    });

    // TODO: uncomment when worker types are defined
    pubsub.subscribe('file:load', () => {
        const visualizeWorker = new Worker(
            new URL('../../../workers/Visualize.worker.ts', import.meta.url),
            { type: 'module' },
        );

        visualizeWorker?.terminate();
    });

    pubsub.subscribe('parsedData:stored', () => {
        finishLoad = true;
        getEstimateData().then((value) => {
            controller.command('updateEstimateData', value);
        });
    });

    // // for when you don't want to send file to backend
    pubsub.subscribe(
        'visualizer:load',
        (_, { content, size, name, visualizer }) => {
            parseGCode(content, size, name, visualizer);
        },
    );

    // TODO: this is where the estimate worker should be terminated, estimate worker is not defined anywhere for some reason
    pubsub.subscribe('estimate:done', (_msg, _data) => {
        // estimateWorker?.terminate();
    });

    pubsub.subscribe(
        'reparseGCode',
        (_msg: string, { content, size, name, visualizer }) => {
            parseGCode(content, size, name, visualizer);
        },
    );

    controller.addListener('workflow:pause', (opts: { data: string }) => {
        const { data } = opts;
        toast.info(
            `'${data}' pause command found in file - press "Resume Job" to continue running.`,
        );
    });

    controller.addListener('sender:M0M1', (opts: { comment: string }) => {
        const { comment = '' } = opts;
        const msg =
            'Hit ‘Close Window‘ if you want to do a tool change, jog, set a new zero, or perform any other operation then hit the standard ‘Resume Job’ button to keep cutting when you’re ready.';

        const content =
            comment.length > 0 ? (
                <div>
                    <p>{msg}</p>
                    <p>
                        Comment: <b>{comment}</b>
                    </p>
                </div>
            ) : (
                msg
            );

        Confirm({
            title: 'M0/M1 Pause',
            content,
            confirmLabel: 'Resume Job',
            cancelLabel: 'Close Window',
            onConfirm: () => {
                controller.command('gcode:resume');
            },
        });
    });

    controller.addListener('outline:start', () => {
        toast.success('Running file outline');
    });

    controller.addListener('homing:flag', (flag: boolean) => {
        reduxStore.dispatch(updateHomingFlag({ homingFlag: flag }));
        pubsub.publish('softlimits:check');
    });

    controller.addListener('firmware:ready', (status: string) => {
        pubsub.publish('firmware:update', status);
    });

    controller.addListener(
        'error',
        (
            error: { type: typeof ALARM | typeof ERROR; lineNumber: number },
            _wasRunning: boolean,
        ) => {
            // const homingEnabled = _get(
            //     reduxStore.getState(),
            //     'controller.settings.settings.$22',
            // );

            if (ALARM_ERROR_TYPES.includes(error.type)) {
                updateAlarmsErrors(error);
            }

            pubsub.publish('error', error);

            // TODO: utilize this if needed, currently not used in new app, try not to use pubsubs
            // set need recovery for start from line when alarm happens
            // if (error.type === ALARM && wasRunning) {
            //     pubsub.publish(
            //         'disconnect:recovery',
            //         error.lineNumber,
            //         homingEnabled,
            //     );
            // }
        },
    );

    controller.addListener(
        'wizard:next',
        (stepIndex: number, substepIndex: number) => {
            pubsub.publish('wizard:next', { stepIndex, substepIndex });
        },
    );

    controller.addListener('filetype', (type: FILE_TYPE_T) => {
        if (type === FILE_TYPE.ROTARY) {
            const workspaceMode: WORKSPACE_MODE_T | null =
                store.get('workspace.mode');

            if (workspaceMode !== WORKSPACE_MODE.ROTARY) {
                Confirm({
                    title: 'Rotary File Loaded',
                    content:
                        'G-Code contains A-axis command, please enable Rotary mode if your machine is equipped with a rotary axis unit.',
                    confirmLabel: 'Enable Rotary Mode',
                    cancelLabel: 'Close',
                    onConfirm: () => {
                        updateWorkspaceMode(WORKSPACE_MODE.ROTARY);
                    },
                });
            }
        }

        if (type === FILE_TYPE.FOUR_AXIS && controller.type === GRBL) {
            Confirm({
                title: '4 Axis File Loaded',
                content:
                    'G-Code contains 4 simultaneous axis commands which are not supported at this time and cannot be run.',
                confirmLabel: null,
                cancelLabel: 'Close',
            });
        }
    });

    controller.addListener('connection:new', (content: string) => {
        console.log('connection:new', content);
    });

    controller.addListener(
        'gcode_error',
        _throttle(
            (error) => {
                errors.push(error);
            },
            250,
            { trailing: false },
        ),
    );

    controller.addListener(
        'settings:description',
        (data: EEPROMDescriptions) => {
            reduxStore.dispatch(
                updateSettingsDescriptions({ descriptions: data }),
            );
        },
    );

    controller.addListener('settings:alarm', (data: BasicObject) => {
        reduxStore.dispatch(updateAlarmDescriptions({ alarms: data }));
    });

    controller.addListener('networkScan:status', (isScanning: boolean) => {
        reduxStore.dispatch(scanNetwork({ isScanning }));

        if (!isScanning) {
            pubsub.publish('networkScan:finished');
        }
    });

    controller.addListener('spindle:add', (spindle: any) => {
        if (Object.hasOwn(spindle, 'id')) {
            reduxStore.dispatch(addSpindle(spindle));
        }
    });

    controller.addListener('job:start', () => {
        errors = [];
    });

    yield null;
}

export function* process(): Generator<null, void, unknown> {
    yield null;
}
