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
import get from 'lodash/get';
import includes from 'lodash/includes';
import PropTypes from 'prop-types';
//import pick from 'lodash/pick';
//import log from 'app/lib/log';
import isElectron from 'is-electron';
import controller from 'app/lib/controller';
import React, { PureComponent } from 'react';
import i18n from 'app/lib/i18n';
import Modal from 'app/components/Modal';
import CameraDisplay from './CameraDisplay/CameraDisplay';
import FunctionButton from '../../components/FunctionButton/FunctionButton';
import ReaderWorker from './FileReader.worker';
import { Toaster, TOASTER_DANGER, TOASTER_INFO, TOASTER_UNTIL_CLOSE } from '../../lib/toaster/ToasterLib';
import {
    // Grbl
    GRBL,
    GRBL_ACTIVE_STATE_ALARM,
    // Marlin
    MARLIN,
    // Smoothie
    SMOOTHIE,
    SMOOTHIE_ACTIVE_STATE_ALARM,
    // TinyG
    TINYG,
    TINYG_MACHINE_STATE_ALARM,
    // Workflow
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_RUNNING
} from '../../constants';
import styles from './workflow-control.styl';
import RecentFileButton from './RecentFileButton';
import { addRecentFile, createRecentFile, createRecentFileFromRawPath } from './ClientRecentFiles';


class WorkflowControl extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
        invalidGcode: PropTypes.string
    };

    fileInputEl = null;

    state = this.getInitialState();

    getInitialState() {
        return {
            testStarted: false,
            fileLoaded: true,
            closeFile: false,
            showRecent: false,
            showLoadFile: false,
        };
    }

    handleClickUpload = (event) => {
        this.fileInputEl.value = null;
        this.fileInputEl.click();
    };

    handleCloseFile = () => {
        this.setState({ closeFile: true });
    }

    handleReaderResponse = ({ data }) => {
        const { actions } = this.props;
        const { meta, result } = data;
        actions.uploadFile(result, meta);
    }

    handleChangeFile = (event, fileToLoad) => {
        const files = event.target.files;
        const file = files[0];

        const meta = {
            name: file.name,
            size: file.size
        };

        const readerWorker = new ReaderWorker();
        readerWorker.onmessage = this.handleReaderResponse;

        if (isElectron()) {
            const recentFile = createRecentFileFromRawPath(file.path, file.name);
            addRecentFile(recentFile);
        }

        readerWorker.postMessage({
            file: file,
            meta: meta
        });
    };

    loadRecentFile = (fileMetadata) => {
        const { actions } = this.props;
        if (fileMetadata === null) {
            Toaster.pop({
                type: TOASTER_DANGER,
                msg: 'Unable to load file - file may have been moved or renamed.'
            });
            return;
        }
        const { result, name, size } = fileMetadata;
        const meta = {
            name: name,
            size: size
        };

        actions.uploadFile(result, meta);
    }

    canRun() {
        const { state } = this.props;
        const { port, gcode, workflow } = state;
        const controllerType = state.controller.type;
        const controllerState = state.controller.state;

        if (!port) {
            return false;
        }
        if (!gcode.ready) {
            return false;
        }
        if (!includes([WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED], workflow.state)) {
            return false;
        }
        if (controllerType === GRBL) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                GRBL_ACTIVE_STATE_ALARM
            ];
            if (includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === MARLIN) {
            // Marlin does not have machine state
        }
        if (controllerType === SMOOTHIE) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                SMOOTHIE_ACTIVE_STATE_ALARM
            ];
            if (includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === TINYG) {
            const machineState = get(controllerState, 'sr.machineState');
            const states = [
                TINYG_MACHINE_STATE_ALARM
            ];
            if (includes(states, machineState)) {
                return false;
            }
        }

        return true;
    }

    handleOnStop = () => {
        const { actions: { handlePause, handleStop } } = this.props;

        handlePause();
        handleStop();
        if (this.state.fileLoaded === false) {
            controller.command('gcode', '$C');
            this.setState({ testStarted: false });
        }
    }


    handleTestFile = (event) => {
        const { actions } = this.props;
        this.setState({ testStarted: true });
        controller.command('gcode', '$c');
        actions.onRunClick();
    };

    startRun = () => {
        this.setState({ fileLoaded: true });
        this.setState({ testStarted: true });
        const { actions } = this.props;
        actions.onRunClick();
    }

    componentDidMount() {
        this.addControllerEvents();
        if (isElectron()) {
            window.ipcRenderer.on('loaded-recent-file', (msg, fileMetaData) => {
                this.loadRecentFile(fileMetaData);
                const recentFile = createRecentFile(fileMetaData);
                addRecentFile(recentFile);
            });
        }
    }

    componentWillUnmount() {
        this.removeControllerEvents();
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

    finishedTestingFileToast = () => {
        Toaster.pop({
            msg: `Finished Checking ${this.state.CurrentGCodeFile}!`,
            type: TOASTER_UNTIL_CLOSE,
            duration: 10000
        });
    }

    errorInGCodeToast = () => {
        Toaster.pop({
            msg: `Error found at line: ${this.state.CurrentGCodeError}`,
            type: TOASTER_UNTIL_CLOSE,
            duration: 20000
        });
    }

    controllerEvents = {
        'task:finish': (data, message) => {
            if (message === 'finished') {
                this.setState({ CurrentGCodeFile: data.name });
                this.finishedTestingFileToast();
            }

            if (message === 'error') {
                this.setState({ CurrentGCodeFile: data.name });
                this.setState({ CurrentGCodeError: this.props.invalidGcode });
                this.errorInGCodeToast();
            }
        }
    }

    render() {
        const { cameraPosition } = this.props.state;
        const { camera } = this.props.actions;
        const { handleOnStop } = this;
        const { state, actions } = this.props;
        const { port, gcode, workflow } = state;
        const canClick = !!port;
        const isReady = canClick && gcode.ready;
        const canRun = this.canRun();
        const canPause = isReady && includes([WORKFLOW_STATE_RUNNING], workflow.state);
        const canStop = isReady && includes([WORKFLOW_STATE_RUNNING, WORKFLOW_STATE_PAUSED], workflow.state);
        // const canClose = isReady && includes([WORKFLOW_STATE_IDLE], workflow.state);
        // const canUpload = isReady ? canClose : (canClick && !gcode.loading);
        if (this.props.state.filename !== '') {
            this.state.fileLoaded = false;
        }

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
                />

                <div className={styles.relativeWrapper}>
                    <button
                        type="button"
                        className={`${styles['workflow-button-upload']}`}
                        title={i18n._('Load File')}
                        onClick={this.handleClickUpload}
                        style={{ writingMode: 'vertical-lr' }}
                    >
                        {i18n._('Load File')} <i className="fa fa-folder-open" style={{ writingMode: 'horizontal-tb' }} />
                    </button>
                    <RecentFileButton />
                    <div
                        role="button"
                        className={this.props.state.gcode.content ? `${styles.closeFileButton}` : `${styles['workflow-button-disabled']}`}
                        onClick={this.handleCloseFile}
                    >
                        <i className="fas fa-times" />
                    </div>
                </div>
                {
                    canRun && (
                        <button
                            type="button"
                            className={this.state.fileLoaded ? `${styles['workflow-button-hidden']}` : `${styles['workflow-button-test']}`}
                            title={i18n._('Test Run Gcode File')}
                            onClick={this.handleTestFile}
                            disabled={!canRun}
                            style={{ writingMode: 'vertical-lr' }}
                        >
                            {i18n._('Test Run File')} <i className="fa fa-tachometer-alt" style={{ writingMode: 'horizontal-tb' }} />
                        </button>
                    )
                }
                {
                    canRun && (
                        <button
                            type="button"
                            className={styles['workflow-button-play']}
                            title={workflow.state === WORKFLOW_STATE_PAUSED ? i18n._('Resume') : i18n._('Run')}
                            onClick={this.startRun}
                            disabled={!canRun}
                        >
                            {i18n._(`${workflow.state === 'paused' ? 'Resume' : 'Start'} Job`)} <i className="fa fa-play" style={{ writingMode: 'horizontal-tb' }} />
                        </button>
                    )
                }
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
                                            <p>Close this gcode File?</p>
                                        </div>
                                        <div className={styles.buttonsContainer}>
                                            <FunctionButton
                                                primary
                                                onClick={() => {
                                                    this.setState({ closeFile: false });
                                                    actions.closeModal();
                                                    actions.unloadGCode();
                                                    actions.reset();
                                                    Toaster.pop({
                                                        msg: 'Gcode File Closed',
                                                        type: TOASTER_INFO,
                                                        icon: 'fa-exclamation'
                                                    });
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


                <CameraDisplay
                    camera={camera}
                    cameraPosition={cameraPosition}
                />
            </div>
        );
    }
}

export default WorkflowControl;
