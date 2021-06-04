
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
import { mapPositionToPreferredUnits } from 'app/lib/units';
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

    pubsubTokens = [];

    componentDidMount() {
        this.subscribe();
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            minimized,
            spindleSpeed,
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
            spindleOverrideLabel: this.getSpindleOverrideLabel(),
            isFullscreen: false,
            fileModal: METRIC_UNITS,
            units: store.get('workspace.units'),
            estimatedTime: 0,
            // G-code Status (from server)
            pausedTime: 0, //
        };
    }

    subscribe() {
        const tokens = [
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
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
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
        const { units, fileModal } = this.state;
        const { workflow, isConnected, senderStatus, bbox, fileProcessing } = this.props;
        const state = {
            ...this.state,
            workflow,
            senderStatus,
            isRunningJob: this.isRunningJob(),
            jobIsPaused: this.jobIsPaused(),
            bbox: mapValues(bbox, (position) => {
                return mapValues(position, (pos, axis) => {
                    return mapPositionToPreferredUnits(pos, fileModal, units);
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
    const bbox = get(store, 'file.bbox');
    const fileProcessing = get(store, 'file.fileProcessing');
    return {
        workflow,
        senderStatus,
        isConnected,
        bbox,
        fileProcessing
    };
})(JobStatusWidget);
