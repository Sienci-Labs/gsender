
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

import mapValues from 'lodash/mapValues';
import pubsub from 'pubsub-js';
import store from 'app/store';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import controller from 'app/lib/controller';
import { mapPositionToUnits } from 'app/lib/units';
import WidgetConfig from '../WidgetConfig';
import JobStatus from './JobStatus';
import {
    IMPERIAL_UNITS,
    METRIC_UNITS, SPINDLE_MODE,
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED
} from '../../constants';
import FileProcessingLoader from './components/FileProcessingLoader';


class JobStatusWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
    };

    // Public methods
    collapse = () => {
        this.setState({ minimized: true });
    };

    expand = () => {
        this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    actions = {
        toggleFullscreen: () => {
            const { minimized, isFullscreen } = this.state;
            this.setState({
                minimized: isFullscreen ? minimized : false,
                isFullscreen: !isFullscreen
            });
        },
        toggleMinimized: () => {
            const { minimized } = this.state;
            this.setState({ minimized: !minimized });
        },
    };

    controllerEvents = {
        'gcode:unload': () => {
            this.setState({
                bbox: {
                    min: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    max: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    delta: {
                        x: 0,
                        y: 0,
                        z: 0
                    }
                }
            });
        },
    };

    pubsubTokens = [];

    componentDidMount() {
        this.subscribe();
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
        this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            minimized,
            spindleSpeed,
            probeFeedrate,
        } = this.state;
        const prevSenderStatus = prevProps.senderStatus;
        const { senderStatus } = this.props;

        if (senderStatus && prevSenderStatus && prevSenderStatus.finishTime !== senderStatus.finishTime && senderStatus.finishTime > 0) {
            this.config.set('lastFile', senderStatus.name);
            this.config.set('lastFileSize', senderStatus.size);
            this.config.set('lastFileRunLength', senderStatus.elapsedTime);
            this.setState({
                lastFileRan: senderStatus.name,
                lastFileSize: senderStatus.size,
                lastFileRunLength: senderStatus.elapsedTime,
            });
        }

        this.config.set('minimized', minimized);
        this.config.set('speed', spindleSpeed);
        this.config.set('probeFeedrate', Number(probeFeedrate));
    }

    getSpindleOverrideLabel() {
        const mode = store.get('widgets.spindle.mode', SPINDLE_MODE);
        if (mode === SPINDLE_MODE) {
            return 'Spindle';
        }
        return 'Laser';
    }

    getInitialState() {
        return {
            lastFileRan: this.config.get('lastFile', ''),
            lastFileSize: this.config.get('lastFileSize', ''),
            lastFileRunLength: this.config.get('lastFileRunLength', ''),
            minimized: this.config.get('minimized', false),
            spindleSpeed: this.config.get('speed', 1000),
            probeFeedrate: Number(this.config.get('probeFeedrate') || 0).toFixed(3) * 1,
            feedrateMin: this.config.get('feedrateMin', 500),
            feedrateMax: this.config.get('feedrateMax', 2000),
            spindleSpeedMin: this.config.get('spindleSpeedMin', 0),
            spindleSpeedMax: this.config.get('spindleSpeedMax', 1000),
            spindleOverrideLabel: this.getSpindleOverrideLabel(),
            feedRates: [],
            spindleRates: [],
            isFullscreen: false,
            fileModal: METRIC_UNITS,
            units: store.get('workspace.units'),
            fileName: '',
            fileSize: 0,
            estimatedTime: 0,

            // G-code Status (from server)
            fileProcessing: false,
            total: 0,
            sent: 0,
            received: 0,
            startTime: 0,
            finishTime: 0,
            elapsedTime: 0,
            remainingTime: 0,

            pausedTime: 0, //

            // Bounding box
            bbox: {
                min: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                max: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                delta: {
                    x: 0,
                    y: 0,
                    z: 0
                }
            }
        };
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('gcode:bbox', (msg, bbox) => {
                const dX = bbox.max.x - bbox.min.x;
                const dY = bbox.max.y - bbox.min.y;
                const dZ = bbox.max.z - bbox.min.z;

                this.setState({
                    bbox: {
                        min: {
                            x: bbox.min.x,
                            y: bbox.min.y,
                            z: bbox.min.z
                        },
                        max: {
                            x: bbox.max.x,
                            y: bbox.max.y,
                            z: bbox.max.z
                        },
                        delta: {
                            x: dX,
                            y: dY,
                            z: dZ
                        }
                    }
                });
            }),
            pubsub.subscribe('file:units', (msg, unitModal) => {
                if (unitModal === 'G21') {
                    this.setState({
                        fileModal: METRIC_UNITS
                    });
                } else {
                    this.setState({
                        fileModal: IMPERIAL_UNITS
                    });
                }
            }),
            pubsub.subscribe('gcode:fileInfo', (msg, file) => {
                if (!file) {
                    this.setState(this.getInitialState());
                    return;
                }
                /* Convert set commands to numbers and get max and min */
                const spindleRates = [];
                const feedRates = [];

                file.movementSet.forEach(item => {
                    feedRates.push(Number(item.substring(1)));
                });
                file.spindleSet.forEach(item => {
                    spindleRates.push(Number(item.substring(1)));
                });

                this.setState({
                    fileProcessing: false,
                    fileName: file.name,
                    total: file.total,
                    toolsAmount: file.toolSet.size,
                    toolsUsed: file.toolSet,
                    spindleRates: spindleRates,
                    feedRates: feedRates,
                    estimatedTime: file.estimatedTime,
                    fileSize: file.size,
                });
            }),
            pubsub.subscribe('units:change', (msg, units) => {
                this.setState({
                    units: units
                });
            }),
            pubsub.subscribe('spindle:mode', (msg, mode) => {
                this.setState({
                    spindleOverrideLabel: this.getSpindleOverrideLabel()
                });
            }),
            pubsub.subscribe('gcode:processing', (msg, value) => {
                this.setState({
                    fileProcessing: true
                });
            })
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
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

    isRunningJob() {
        const { workflow } = this.props;

        return workflow.state !== WORKFLOW_STATE_IDLE;
    }

    jobIsPaused() {
        const { workflow } = this.props;
        return workflow.state === WORKFLOW_STATE_PAUSED;
    }

    render() {
        const { units, bbox, fileProcessing } = this.state;
        const { workflow, isConnected, senderStatus } = this.props;
        const state = {
            ...this.state,
            workflow,
            senderStatus,
            isRunningJob: this.isRunningJob(),
            jobIsPaused: this.jobIsPaused(),
            bbox: mapValues(bbox, (position) => {
                return mapValues(position, (pos, axis) => {
                    return mapPositionToUnits(pos, units);
                });
            }),
            isConnected
        };
        const actions = {
            ...this.actions
        };

        return (
            <>
                {fileProcessing
                    ? <FileProcessingLoader />
                    : <JobStatus
                        state={state}
                        actions={actions}
                    />
                }
            </>
        );
    }
}

export default connect((store) => {
    const workflow = get(store, 'controller.workflow');
    const senderStatus = get(store, 'controller.sender.status');
    const isConnected = get(store, 'connection.isConnected');
    return {
        workflow,
        senderStatus,
        isConnected
    };
})(JobStatusWidget);
