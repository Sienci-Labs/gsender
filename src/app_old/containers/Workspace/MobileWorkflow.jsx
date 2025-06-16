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

/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { PureComponent } from 'react';
import get from 'lodash/get';
import includes from 'lodash/includes';
import store from 'app/store';
import { connect } from 'react-redux';
import reduxStore from 'app/store/redux';
import { UPDATE_JOB_OVERRIDES } from 'app/actions/visualizerActions';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import styles from 'app/widgets/Visualizer/workflow-control.styl';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_CHECK,
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_JOG,
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_RUNNING,
    METRIC_UNITS, IMPERIAL_UNITS,
} from '../../constants';
import { RadioButton, RadioGroup } from 'Components/Radio';
import pubsub from 'pubsub-js';

class WorkflowControl extends PureComponent {
    fileInputEl = null;

    state = this.getInitialState();

    pubsubTokens = [];

    workerOutline = null;

    actions = {
        onRunClick: () => {
            this.actions.handleRun();
        },
        handleRun: () => {
            const { workflowState, activeState } = this.props;
            console.assert(includes([WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED], workflowState) || activeState === GRBL_ACTIVE_STATE_HOLD);
            this.setState((prev) => ({ invalidGcode: { ...prev.invalidGcode, showModal: false } }));

            if (workflowState === WORKFLOW_STATE_IDLE) {
                controller.command('gcode:start');
                return;
            }

            if (workflowState === WORKFLOW_STATE_PAUSED || activeState === GRBL_ACTIVE_STATE_HOLD) {
                controller.command('gcode:resume');
            }
        },
        handlePause: () => {
            controller.command('gcode:pause');
        },
        handleStop: () => {
            controller.command('gcode:stop', { force: true });
        },
        handleUnitSwap: (value) => {

            this.setState({
                units: value
            });
            pubsub.publish('units:change', value);
        }
    };

    getInitialState() {
        return {
            units: store.get('workspace.units', METRIC_UNITS),
            testStarted: false,
            fileLoaded: true,
            closeFile: false,
            showRecent: false,
            showLoadFile: false,
            runHasStarted: false,
            outlineRunning: false,
            startFromLine: {
                showModal: false,
                needsRecovery: false,
                value: 0,
                waitForHoming: false,
                safeHeight: store.get('workspace.units', METRIC_UNITS) === METRIC_UNITS ? 10 : 0.4,
                defaultSafeHeight: store.get('workspace.units', METRIC_UNITS) === METRIC_UNITS ? 10 : 0.4
            },
        };
    }

    canRun() {
        const { isConnected, fileLoaded, workflowState, activeState } = this.props;


        if (!isConnected) {
            return false;
        }
        if (!fileLoaded) {
            return false;
        }

        if ([GRBL_ACTIVE_STATE_HOLD, GRBL_ACTIVE_STATE_JOG].includes(activeState)) {
            return true;
        }

        if (!includes([WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED], workflowState)) {
            return false;
        }
        const states = [
            GRBL_ACTIVE_STATE_IDLE,
            GRBL_ACTIVE_STATE_HOLD,
            GRBL_ACTIVE_STATE_CHECK
        ];

        if (includes([GRBL_ACTIVE_STATE_CHECK], activeState) && !includes([WORKFLOW_STATE_PAUSED, WORKFLOW_STATE_IDLE], workflowState)) {
            return false;
        }

        return includes(states, activeState);
    }

    handleOnStop = () => {
        const { controllerState, senderStatus } = this.props;
        const { status } = controllerState;
        const { handleStop } = this.actions;

        const { received } = senderStatus;
        handleStop();
        reduxStore.dispatch({ type: UPDATE_JOB_OVERRIDES, payload: { isChecked: false, toggleStatus: 'jobStatus' } });
        this.setState(prev => ({ runHasStarted: false, startFromLine: { ...prev.startFromLine, value: received } }));
        if (status.activeState === 'Check') {
            controller.command('gcode', '$C');
        }
    }

    startRun = () => {
        const { activeState } = this.props;

        if (activeState === GRBL_ACTIVE_STATE_CHECK) {
            this.setState({ testStarted: true, runHasStarted: true });

            controller.command('gcode:resume');
            return;
        }
        this.setState({ fileLoaded: true });
        this.setState({ runHasStarted: true });
        reduxStore.dispatch({ type: UPDATE_JOB_OVERRIDES, payload: { isChecked: true, toggleStatus: 'overrides' } });
        this.actions.onRunClick();
    }

    render() {
        const { handleOnStop } = this;
        const { runHasStarted, units } = this.state;
        const { fileLoaded, workflowState, isConnected, senderInHold, activeState } = this.props;
        const canClick = !!isConnected;
        const isReady = canClick && fileLoaded;
        const canRun = this.canRun();
        const canPause = isReady && activeState !== GRBL_ACTIVE_STATE_HOLD && activeState !== GRBL_ACTIVE_STATE_CHECK &&
            includes([WORKFLOW_STATE_RUNNING], workflowState);
        const canStop = isReady && includes([WORKFLOW_STATE_RUNNING, WORKFLOW_STATE_PAUSED], workflowState);
        const activeHold = activeState === GRBL_ACTIVE_STATE_HOLD;
        const workflowPaused = runHasStarted && (workflowState === WORKFLOW_STATE_PAUSED || senderInHold || activeHold);

        return (// if it's not in remote mode, none of these will be true
            <div>
                <div className={styles.widgetHeaderMobile}>
                    <div className={styles.widgetTitleMobile}>
                        {i18n._('Workflow Controls')}
                    </div>
                </div>
                <div className={styles.widgetContentMobile}>
                    <RadioGroup
                        name="units"
                        value={units}
                        depth={2}
                        onChange={(value) => this.actions.handleUnitSwap(value)}
                        size="small"
                    >
                        <div>
                            <RadioButton className={styles.prefferedradio} label="Inches" value={IMPERIAL_UNITS} />
                            <RadioButton className={styles.prefferedradio} label="Millimeters" value={METRIC_UNITS} />
                        </div>
                    </RadioGroup>
                    <div className={styles.workflowControlMobile}>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', flexWrap: 'wrap' }}>
                            {
                                canRun && (
                                    <div className={styles.relativeWrapper}>
                                        <button
                                            type="button"
                                            className={styles['workflow-button-play']}
                                            title={workflowPaused ? i18n._('Resume') : i18n._('Run')}
                                            onClick={this.startRun}
                                            disabled={!isConnected}
                                        >
                                            {i18n._(`${workflowPaused ? 'Resume' : 'Start'} Job`)} <i className="fa fa-play" style={{ writingMode: 'horizontal-tb', marginLeft: '5px' }} />
                                        </button>
                                    </div>
                                )
                            }

                            {
                                canPause && (
                                    <button
                                        type="button"
                                        className={styles['workflow-button-pause']}
                                        title={i18n._('Pause')}
                                        onClick={this.actions.handlePause}
                                        disabled={!canPause}
                                    >
                                        {i18n._('Pause Job')} <i className="fa fa-pause" style={{ writingMode: 'vertical-lr' }} />
                                    </button>
                                )
                            }

                            {
                                canStop && (
                                    <button
                                        type="button"
                                        className={styles['workflow-button-stop']}
                                        title={i18n._('Stop')}
                                        onClick={handleOnStop}
                                        disabled={!canStop}
                                    >
                                        {i18n._('Stop Job')} <i className="fa fa-stop" style={{ writingMode: 'vertical-lr' }} />
                                    </button>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect((store) => {
    const fileLoaded = get(store, 'file.fileLoaded', false);
    const isConnected = get(store, 'connection.isConnected', false);
    const senderInHold = get(store, 'controller.sender.status.hold', false);
    const senderStatus = get(store, 'controller.sender.status');
    const workflowState = get(store, 'controller.workflow.state');
    const activeState = get(store, 'controller.state.status.activeState');
    const controllerState = get(store, 'controller.state');
    return {
        fileLoaded,
        isConnected,
        senderInHold,
        workflowState,
        activeState,
        senderStatus,
        controllerState,
    };
}, null, null, { forwardRef: true })(WorkflowControl);
