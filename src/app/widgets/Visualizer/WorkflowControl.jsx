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
import uniqueId from 'lodash/uniqueId';
import store from 'app/store';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import isElectron from 'is-electron';
import cx from 'classnames';
import reduxStore from 'app/store/redux';
import { UPDATE_JOB_OVERRIDES } from 'app/actions/visualizerActions';
import controller from 'app/lib/controller';
import api from 'app/api';
import pubsub from 'pubsub-js';
import i18n from 'app/lib/i18n';
import Modal from 'app/components/Modal';
import Input from 'app/containers/Preferences/components/Input';

import WorkerOutline from '../../workers/Outline.worker';
import CameraDisplay from './CameraDisplay/CameraDisplay';
import FunctionButton from '../../components/FunctionButton/FunctionButton';
import {
    Toaster,
    TOASTER_SUCCESS,
    TOASTER_DANGER,
    TOASTER_WARNING,
    TOASTER_UNTIL_CLOSE,
    TOASTER_LONG,
    TOASTER_INFO
} from '../../lib/toaster/ToasterLib';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_CHECK,
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_JOG,
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_RUNNING,
    VISUALIZER_PRIMARY, LASER_MODE,
    METRIC_UNITS,
    GRBL_ACTIVE_STATE_HOME,
    IMPERIAL_UNITS,
    JOB_STATUS
} from '../../constants';
import styles from './workflow-control.styl';
import RecentFileButton from './RecentFileButton';
import { addRecentFile, createRecentFileFromRawPath } from './ClientRecentFiles';
import { UPDATE_FILE_INFO } from '../../actions/fileInfoActions';
import { outlineResponse } from '../../workers/Outline.response';
import { shouldVisualizeSVG } from '../../workers/Visualize.response';
import Tooltip from '../../components/TooltipCustom/ToolTip';
import { storeUpdate } from '../../lib/storeUpdate';
import { convertMillisecondsToTimeStamp } from '../../lib/datetime';

class WorkflowControl extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
        invalidGcode: PropTypes.string,
        liteMode: PropTypes.bool
    };

    fileInputEl = null;

    state = this.getInitialState();

    pubsubTokens = [];

    workerOutline = null;

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
            job: {
                showStats: false,
                time: 0,
                status: JOB_STATUS.COMPLETE,
                errors: []
            },
        };
    }

    handleClickUpload = () => {
        if (isElectron()) {
            window.ipcRenderer.send('open-upload-dialog');
        } else {
            this.fileInputEl.value = null;
            this.fileInputEl.click();
        }
    };

    handleCloseFile = () => {
        this.setState({ closeFile: true });
    }

    handleReaderResponse = ({ data }) => {
        const { actions } = this.props;
        const { meta, result } = data;
        actions.uploadFile(result, meta);
    }

    handleChangeFile = async (event) => {
        const files = event.target.files;
        const file = files[0];

        const hooks = store.get('workspace.toolChangeHooks', {});
        const toolChangeOption = store.get('workspace.toolChangeOption', 'Ignore');
        const toolChangeConfig = store.get('workspace.toolChange', {});
        const toolChangeContext = {
            ...hooks,
            ...toolChangeConfig,
            toolChangeOption
        };

        controller.command('toolchange:context', toolChangeContext);
        await api.file.upload(file, controller.port, VISUALIZER_PRIMARY);
    };

    handleElectronFileUpload = async (file) => {
        const serializedFile = new File([file.data], file.name, { path: file.path });

        if (isElectron()) {
            const recentFile = createRecentFileFromRawPath(file.path, file.name);
            addRecentFile(recentFile);
        }

        await api.file.upload(serializedFile, controller.port, VISUALIZER_PRIMARY);
        reduxStore.dispatch({
            type: UPDATE_FILE_INFO,
            payload: { path: file.path },
        });
    };

    loadRecentFile = async (fileMetadata) => {
        if (fileMetadata === null) {
            Toaster.pop({
                type: TOASTER_DANGER,
                msg: 'Unable to load file - file may have been moved or renamed.'
            });
            return;
        }
        const { result, name } = fileMetadata;
        const serializedFile = new File([result], name);
        await api.file.upload(serializedFile, controller.port, VISUALIZER_PRIMARY);
        reduxStore.dispatch({
            type: UPDATE_FILE_INFO,
            payload: { path: fileMetadata.fullPath },
        });
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
        const { actions: { handleStop }, controllerState, senderStatus } = this.props;
        const { status } = controllerState;

        const { received } = senderStatus;
        handleStop();
        reduxStore.dispatch({ type: UPDATE_JOB_OVERRIDES, payload: { isChecked: false, toggleStatus: 'jobStatus' } });
        this.setState(prev => ({ runHasStarted: false, startFromLine: { ...prev.startFromLine, value: received } }));
        if (status.activeState === 'Check') {
            controller.command('gcode', '$C');
        }
    }


    handleTestFile = () => {
        this.setState({ runHasStarted: true });
        controller.command('gcode:test');
    };

    runOutline = () => {
        if (this.state.outlineRunning) {
            return;
        }

        const { actions } = this.props;
        const vertices = actions.getHull();

        this.setState({ outlineRunning: true });

        this.workerOutline = new WorkerOutline();
        const machineProfile = store.get('workspace.machineProfile');
        const spindleMode = store.get('widgets.spindle.mode');
        // outline toggled on and currently in laser mode
        const isLaser = machineProfile.laserOnOutline && spindleMode === LASER_MODE;

        Toaster.pop({
            TYPE: TOASTER_INFO,
            duration: TOASTER_LONG,
            msg: 'Generating outline for current file'
        });
        this.workerOutline.onmessage = ({ data }) => {
            outlineResponse({ data }, machineProfile.laserOnOutline);
            // Enable the outline button again
            this.setState({ outlineRunning: false });
        };

        this.workerOutline.postMessage({
            isLaser,
            parsedData: vertices
        });
        /*
        getParsedData().then((value) => {
            const parsedData = value;
            this.workerOutline.postMessage({ isLaser, parsedData });
        }); // data from GCodeVirtualizer*/
    };

    startRun = () => {
        const { activeState } = this.props;

        Toaster.clear();

        if (activeState === GRBL_ACTIVE_STATE_CHECK) {
            this.setState({ testStarted: true, runHasStarted: true });

            controller.command('gcode:resume');
            return;
        }
        this.setState({ fileLoaded: true });
        this.setState({ runHasStarted: true });
        reduxStore.dispatch({ type: UPDATE_JOB_OVERRIDES, payload: { isChecked: true, toggleStatus: 'overrides' } });
        const { actions } = this.props;
        actions.onRunClick();
    }

    componentDidMount() {
        if (isElectron()) {
            window.ipcRenderer.on('loaded-recent-file', (_, fileMetaData) => {
                if (!fileMetaData) {
                    Toaster.pop({
                        msg: 'Error loading recent file, it may have been deleted or moved to a different folder.',
                        type: TOASTER_DANGER,
                        duration: 5000
                    });

                    return;
                }

                this.loadRecentFile(fileMetaData);
                // const recentFile = createRecentFile(fileMetaData);
                // addRecentFile(recentFile);
            });
            window.ipcRenderer.on('returned-upload-dialog-data', (_, file) => {
                this.handleElectronFileUpload(file);
            });
        }
        this.subscribe();
    }

    componentDidUpdate(prevProps) {
        const { activeState: prevActiveState, state: prevState } = prevProps;
        const { activeState: currentActiveState, state: currentState, fileCompletion } = this.props;
        const { gcode: { content: prevGcode } } = prevState;
        const { gcode: { content: currentGcode } } = currentState;
        const { waitForHoming } = this.state.startFromLine;

        if ((prevActiveState === GRBL_ACTIVE_STATE_CHECK && currentActiveState !== GRBL_ACTIVE_STATE_CHECK) || prevGcode !== currentGcode) {
            this.updateRunHasStarted();
        }
        if (prevActiveState === GRBL_ACTIVE_STATE_HOME && currentActiveState !== GRBL_ACTIVE_STATE_HOME && waitForHoming) {
            this.moveToWCSZero();
        }
        if (prevProps.fileCompletion === 0 && fileCompletion !== 0) {
            this.updateStartFromLine();
        }
    }

    updateRunHasStarted() {
        this.setState({ runHasStarted: false });
    }

    updateStartFromLine() {
        this.setState(prev => ({
            startFromLine: {
                ...prev.startFromLine,
                showModal: false,
                value: 1,
            }
        }));
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    finishedTestingFileToast = () => {
        Toaster.pop({
            msg: `Finished Checking ${this.state.CurrentGCodeFile}!`,
            type: TOASTER_UNTIL_CLOSE,
            duration: 10000
        });
    }

    startFromLinePrompt = () => {
        const { received } = this.props.senderStatus;
        this.setState(prev => ({
            startFromLine: {
                ...prev.startFromLine,
                showModal: true,
                value: received !== 0 ? received : prev.startFromLine.value
            }
        }));
    }

    handleStartFromLine = () => {
        const { zMax } = this.props;
        const { units } = this.state;
        const { value, safeHeight } = this.state.startFromLine;

        this.setState(prev => ({ startFromLine: { ...prev.startFromLine, showModal: false, needsRecovery: false } }));
        const newSafeHeight = units === IMPERIAL_UNITS ? safeHeight * 25.4 : safeHeight;
        controller.command('gcode:start', value, zMax, newSafeHeight);
        reduxStore.dispatch({ type: UPDATE_JOB_OVERRIDES, payload: { isChecked: true, toggleStatus: 'overrides' } });
        Toaster.pop({
            msg: 'Running Start From Specific Line Command',
            type: TOASTER_SUCCESS,
            duration: 2000,
        });
    }

    moveToWCSZero = () => {
        const { homingEnabled } = this.props;
        const { units } = this.state;
        const safeRetractHeight = store.get('workspace.safeRetractHeight');
        const modal = (units === METRIC_UNITS) ? 'G21' : 'G20';

        if (safeRetractHeight !== 0) {
            if (homingEnabled) {
                controller.command('gcode:safe', `G53 G0 Z${(Math.abs(safeRetractHeight) * -1)}`, modal);
            } else {
                controller.command('gcode', 'G91');
                controller.command('gcode:safe', `G0 Z${safeRetractHeight}`, modal); // Retract Z when moving across workspace
            }
        }
        controller.command('gcode', 'G90');
        controller.command('gcode', 'G0 X0 Y0'); //Move to Work Position Zero
        controller.command('gcode', 'G0 Z0');

        this.setState(prev => ({
            startFromLine: {
                ...prev.startFromLine,
                showModal: true,
                needsRecovery: true,
                waitForHoming: false
            }
        }));
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('gcode:toolChange', (msg, context) => {
                const { comment } = context;
                Toaster.pop({
                    msg: `Program execution paused due to M6 command with the following comment: ${comment}`,
                    type: TOASTER_WARNING
                });
            }),
            pubsub.subscribe('outline:done', () => {
                this.workerOutline.terminate();
            }),
            pubsub.subscribe('disconnect:recovery', (msg, received, homingEnabled) => {
                if (homingEnabled) {
                    controller.command('homing');
                    this.setState(prev => ({
                        startFromLine: {
                            ...prev.startFromLine,
                            value: received,
                            waitForHoming: true
                        }
                    }));
                } else {
                    this.setState(prev => ({
                        startFromLine: {
                            ...prev.startFromLine,
                            value: received,
                            needsRecovery: true
                        }
                    }));
                }
            }),
            pubsub.subscribe('units:change', (msg, units) => {
                this.changeUnits(units);
            }),
            pubsub.subscribe('store:update', (msg, content) => {
                storeUpdate(content, true);
            }),
            pubsub.subscribe('litemode:change', (msg, isFileLoaded) => {
                // force update so the workflow controls update correctly for the visualizer used
                if (!isFileLoaded) {
                    this.forceUpdate();
                }
            }),
            pubsub.subscribe('job:end', (_, data) => {
                const { status, errors } = data;
                const { jobEndModal } = this.props.state;
                this.setState({
                    job: {
                        showStats: jobEndModal, // if not showing job end modal, don't set to true
                        time: convertMillisecondsToTimeStamp(status.elapsedTime),
                        status: status.finishTime ? JOB_STATUS.COMPLETE : JOB_STATUS.STOPPED,
                        errors: errors
                    }
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

    changeUnits(newUnits) {
        const { safeHeight } = this.state.startFromLine;
        const newSafeHeight = newUnits === METRIC_UNITS ? (safeHeight * 25.4).toFixed(1) : (safeHeight / 25.4).toFixed(1);
        const newDefaultSafeHeight = newUnits === METRIC_UNITS ? 10 : 0.4;

        this.setState({
            units: newUnits,
        }, () => {
            this.setState(prev => ({
                startFromLine: {
                    ...prev.startFromLine,
                    safeHeight: newSafeHeight,
                    defaultSafeHeight: newDefaultSafeHeight
                }
            }));
        });
    }


    render() {
        const { cameraPosition } = this.props.state;
        const { camera } = this.props.actions;
        const { handleOnStop } = this;
        const { runHasStarted, units } = this.state;
        const { fileLoaded, actions, workflowState, isConnected, senderInHold, activeState, lineTotal } = this.props;
        const canClick = !!isConnected;
        const isReady = canClick && fileLoaded;
        const canRun = this.canRun();
        const canPause = isReady && activeState !== GRBL_ACTIVE_STATE_HOLD && activeState !== GRBL_ACTIVE_STATE_CHECK &&
            includes([WORKFLOW_STATE_RUNNING], workflowState);
        const canStop = isReady && includes([WORKFLOW_STATE_RUNNING, WORKFLOW_STATE_PAUSED], workflowState);
        const activeHold = activeState === GRBL_ACTIVE_STATE_HOLD;
        const workflowPaused = runHasStarted && (workflowState === WORKFLOW_STATE_PAUSED || senderInHold || activeHold);
        const { showModal, needsRecovery, value, safeHeight, defaultSafeHeight } = this.state.startFromLine;
        const { showStats, status, time, errors } = this.state.job;
        const statusColour = status === JOB_STATUS.COMPLETE ? 'green' : 'red';
        const renderSVG = shouldVisualizeSVG();

        return (
            <div className={styles.workflowControl}>
                <input
                    // The ref attribute adds a reference to the component to
                    // this.refs when the component is mounted.
                    ref={(node) => {
                        this.fileInputEl = node;
                    }}
                    type="file"
                    style={{ display: 'none' }}
                    multiple={false}
                    onChange={this.handleChangeFile}
                    accept=".gcode,.gc,.nc,.tap,.cnc"
                    id="fileInput"
                />

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: 'calc(100% - 9rem)' }}>
                    {
                        workflowState === WORKFLOW_STATE_IDLE && (
                            <div className={styles.relativeWrapper}>
                                <button
                                    type="button"
                                    className={styles['workflow-button-upload']}
                                    title={i18n._('Load File')}
                                    onClick={this.handleClickUpload}
                                >
                                    {i18n._('Load File')} <i className="fa fa-folder-open" style={{ writingMode: 'horizontal-tb' }} />
                                </button>
                                <RecentFileButton />
                                <div
                                    role="button"
                                    className={fileLoaded ? `${styles.closeFileButton}` : `${styles['workflow-button-disabled']}`}
                                    onClick={this.handleCloseFile}
                                >
                                    <i className="fas fa-times" />
                                </div>
                            </div>
                        )
                    }

                    {
                        !workflowPaused && (
                            <div className={styles.splitContainer} style={{ display: !canRun ? 'none' : '' }}>
                                <button
                                    type="button"
                                    className={!canRun ? `${styles['workflow-button-disabled']}` : `${styles['workflow-button-test']}`}
                                    title={i18n._('Outline')}
                                    onClick={this.runOutline}
                                    disabled={!canRun}
                                    style={{ marginRight: '1rem' }}
                                >
                                    {i18n._('Outline')} <i className="fas fa-vector-square" style={{ writingMode: 'horizontal-tb' }} />
                                </button>
                                <button
                                    type="button"
                                    className={!canRun ? `${styles['workflow-button-disabled']}` : `${styles['workflow-button-test']}`}
                                    title={i18n._('Verify Job')}
                                    onClick={this.handleTestFile}
                                    disabled={!canRun}
                                >
                                    {i18n._('Verify Job')} <i className="fa fa-tachometer-alt" style={{ writingMode: 'horizontal-tb' }} />
                                </button>
                            </div>
                        )

                    }
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
                                {
                                    !workflowPaused && (
                                        <div
                                            role="button"
                                            className={cx(
                                                styles['start-from-line-button'],
                                                { [styles.pulse]: needsRecovery }
                                            )}
                                            onClick={this.startFromLinePrompt}
                                        >
                                            <i className="fas fa-list-ol" />
                                        </div>
                                    )
                                }
                            </div>
                        )
                    }

                    {
                        canPause && (
                            <button
                                type="button"
                                className={styles['workflow-button-pause']}
                                title={i18n._('Pause')}
                                onClick={actions.handlePause}
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

                {
                    this.state.closeFile && (
                        <Modal showCloseButton={false}>
                            <Modal.Header className={styles.modalHeader}>
                                <Modal.Title>Are You Sure?</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className={styles.runProbeBody}>
                                    <div className={styles.left}>
                                        <div className={styles.greyText}>
                                            <p>Close this g-code File?</p>
                                        </div>
                                        <div className={styles.buttonsContainer}>
                                            <FunctionButton
                                                primary
                                                onClick={() => {
                                                    this.setState({ closeFile: false });
                                                    actions.closeModal();
                                                    actions.unloadGCode();
                                                    actions.reset();
                                                }}
                                            >
                                                Yes
                                            </FunctionButton>
                                            <FunctionButton
                                                className={styles.activeButton}
                                                onClick={() => {
                                                    this.setState({ closeFile: false });
                                                    actions.closeModal();
                                                }}
                                            >
                                                No
                                            </FunctionButton>
                                        </div>
                                    </div>

                                </div>
                            </Modal.Body>
                        </Modal>
                    )
                }
                {
                    showModal && (
                        <Modal onClose={() => {
                            this.setState(prev => ({ startFromLine: { ...prev.startFromLine, showModal: false, needsRecovery: false } }));
                            actions.closeModal();
                        }}
                        >
                            <Modal.Header className={styles.modalHeader}>
                                <Modal.Title>{needsRecovery ? 'Recovery: Start From Line' : 'Start From Line'}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body style={{ backgroundColor: '#e5e7eb' }}>
                                <div className={styles.startFromLineContainer}>
                                    <div className={styles.startDetails}>
                                        <p className={styles.firstDetail}>
                                            Recover a carve disrupted by power loss, disconnection,
                                            mechanical malfunction, or other failures
                                        </p>
                                        <p style={{ marginBottom: '0px', color: '#000000' }}>Your job was last stopped around line: <b>{value}</b></p>
                                        <p>on a g-code file with a total of <b>{lineTotal}</b> lines</p>
                                        {
                                            value > 0 &&
                                                <p>Recommended starting lines: <strong>{value - 10 >= 0 ? value - 10 : 0}</strong> - <strong>{value}</strong></p>
                                        }
                                    </div>
                                    <div>
                                        <Input
                                            label="Resume job at line:"
                                            value={value}
                                            onChange={(e) => (e.target.value <= lineTotal && e.target.value >= 0) &&
                                                this.setState(prev => ({
                                                    startFromLine: {
                                                        ...prev.startFromLine,
                                                        value: Math.ceil(Number(e.target.value))
                                                    }
                                                }))
                                            }
                                            additionalProps={{ type: 'number', max: lineTotal, min: 0 }}
                                        />
                                    </div>
                                    <div>
                                        <Tooltip content={`Default Value: ${defaultSafeHeight}`}>
                                            <Input
                                                label="With Safe Height:"
                                                value={safeHeight}
                                                onChange={(e) => {
                                                    this.setState(prev => ({
                                                        startFromLine: {
                                                            ...prev.startFromLine,
                                                            safeHeight: Number(e.target.value)
                                                        }
                                                    }));
                                                }}
                                                units={units}
                                                additionalProps={{ type: 'number' }}
                                            />
                                        </Tooltip>
                                        <div className={cx(styles.startDetails, styles.small)} style={{ float: 'right', marginRight: '1rem' }}>
                                            <p>
                                                (Safe Height is the value above Z max)
                                            </p>
                                        </div>
                                    </div>
                                    <div className={styles.startHeader}>
                                        <p style={{ color: '#E2943B' }}>
                                            Accounts for all past CNC movements, units, spindle speeds,
                                            laser power, Start/Stop g-code, and any other file modals or setup.
                                        </p>
                                    </div>
                                    <div className={styles.buttonsContainer}>
                                        <button
                                            type="button"
                                            className={styles['workflow-button-play']}
                                            title="Start from Line"
                                            onClick={this.handleStartFromLine}
                                            disabled={!isConnected}
                                        >
                                            Start from Line
                                            <i className="fa fa-play" style={{ writingMode: 'horizontal-tb', marginLeft: '5px' }} />
                                        </button>
                                    </div>
                                </div>
                            </Modal.Body>
                        </Modal>
                    )
                }
                {
                    showStats && (
                        <Modal onClose={() => {
                            this.setState({
                                job: {
                                    showStats: false,
                                    time: 0,
                                    status: JOB_STATUS.COMPLETE,
                                    errors: []
                                }
                            });
                            actions.closeModal();
                        }}
                        >
                            <Modal.Header className={styles.modalHeader}>
                                <Modal.Title>Job End</Modal.Title>
                            </Modal.Header>
                            <Modal.Body style={{ backgroundColor: '#e5e7eb' }}>
                                <div className={styles.jobEndContainer}>
                                    <div className={[styles.statsWrapper, styles.left].join(' ')}>
                                        <div>
                                            <strong>Status:</strong>
                                            <span style={{ color: statusColour }}>{` ${status}\n`}</span>
                                        </div>
                                        <div>
                                            <strong>Time:</strong>
                                            <span>{` ${time}\n`}</span>
                                        </div>
                                        <strong>{'Errors:\n'}</strong>

                                        {
                                            errors.length === 0
                                                ? <span className={styles.statsWrapper} style={{ marginLeft: '10px' }}>None</span>
                                                : (
                                                    <span className={styles.statsWrapper} style={{ marginLeft: '10px', color: 'red' }}>
                                                        {
                                                            errors.map(error => {
                                                                return <span key={uniqueId()}>{`- ${error}\n`}</span>;
                                                            })
                                                        }
                                                    </span>
                                                )
                                        }
                                    </div>
                                    <div className={styles.buttonsContainer}>
                                        <FunctionButton
                                            className={styles.activeButton}
                                            onClick={() => {
                                                this.setState({
                                                    job: {
                                                        showStats: false,
                                                        time: 0,
                                                        status: JOB_STATUS.COMPLETE,
                                                        errors: []
                                                    }
                                                });
                                                actions.closeModal();
                                            }}
                                        >
                                            Close
                                        </FunctionButton>
                                    </div>
                                </div>
                            </Modal.Body>
                        </Modal>
                    )}
                {
                    !renderSVG
                        ? (
                            <CameraDisplay
                                camera={camera}
                                cameraPosition={cameraPosition}
                            />
                        ) : null
                }
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
    const lineTotal = get(store, 'file.total');
    const port = get(store, 'connection.port');
    const gcode = get(store, 'file.content');
    const fileCompletion = get(store, 'controller.sender.status.finishTime', 0);
    const zMax = get(store, 'file.bbox.max.z', 0) || 0;
    const homingSetting = get(store, 'controller.settings.settings.$22', 0);
    const homingEnabled = homingSetting !== '0';
    return {
        fileLoaded,
        isConnected,
        senderInHold,
        workflowState,
        activeState,
        senderStatus,
        controllerState,
        port,
        lineTotal,
        gcode,
        fileCompletion,
        zMax,
        homingEnabled
    };
}, null, null, { forwardRef: true })(WorkflowControl);
