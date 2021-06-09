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
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import isElectron from 'is-electron';
import controller from 'app/lib/controller';
import React, { PureComponent } from 'react';
import pubsub from 'pubsub-js';
import i18n from 'app/lib/i18n';
import Modal from 'app/components/Modal';
import CameraDisplay from './CameraDisplay/CameraDisplay';
import FunctionButton from '../../components/FunctionButton/FunctionButton';
import ReaderWorker from './FileReader.worker';
import { Toaster, TOASTER_DANGER, TOASTER_WARNING, TOASTER_UNTIL_CLOSE } from '../../lib/toaster/ToasterLib';
import {
    // Grbl
    GRBL_ACTIVE_STATE_ALARM,
    // Marlin
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

    pubsubTokens = []

    getInitialState() {
        return {
            testStarted: false,
            fileLoaded: true,
            closeFile: false,
            showRecent: false,
            showLoadFile: false,
            runHasStarted: false
        };
    }

    handleClickUpload = (event) => {
        this.fileInputEl.value = null;
        this.fileInputEl.click();
    };

    handleCloseFile = () => {
        this.setState({ closeFile: true });
        pubsub.publish('gcode:unload');
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
        this.setState({ fileLoaded: false });
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
        this.setState({ runHasStarted: false });
    }

    canRun() {
        const { state } = this.props;
        const { port, gcode, workflow, controllerState } = state;

        if (!port) {
            return false;
        }
        if (!gcode.ready) {
            return false;
        }
        if (!includes([WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED], workflow.state)) {
            return false;
        }
        const activeState = get(controllerState, 'status.activeState');
        const states = [
            GRBL_ACTIVE_STATE_ALARM
        ];

        return !includes(states, activeState);
    }

    handleOnStop = () => {
        const { actions: { handlePause, handleStop } } = this.props;
        handlePause();
        handleStop();
    }


    handleTestFile = (event) => {
        const { actions } = this.props;
        this.setState({ runHasStarted: true });
        const gcode = this.props.state.gcode.content; // or whatever the state member is
        const comments = ['#', ';', '(', '%'];
        const lines = gcode.split('\n')
            .filter(line => (line.trim().length > 0))
            .filter(line => !comments.some(comment => line.includes(comment)));
        const testLines = ['$C', ...lines, '$C'];
        controller.command('gcode', testLines);
        actions.onRunClick();
    };

    startRun = () => {
        this.setState({ fileLoaded: true });
        this.setState({ testStarted: true });
        this.setState({ runHasStarted: true });
        const { actions } = this.props;
        actions.onRunClick();
    }

    componentDidMount() {
        if (isElectron()) {
            window.ipcRenderer.on('loaded-recent-file', (msg, fileMetaData) => {
                this.loadRecentFile(fileMetaData);
                const recentFile = createRecentFile(fileMetaData);
                addRecentFile(recentFile);
            });
        }
        this.subscribe();
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

    errorInGCodeToast = () => {
        Toaster.pop({
            msg: `Error found at line: ${this.state.CurrentGCodeError}`,
            type: TOASTER_UNTIL_CLOSE,
            duration: 20000
        });
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('gcode:toolChange', (msg) => {
                Toaster.pop({
                    msg: 'Program execution paused due to M6 command',
                    type: TOASTER_WARNING
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

    render() {
        const { cameraPosition } = this.props.state;
        const { camera } = this.props.actions;
        const { handleOnStop } = this;
        const { state, actions } = this.props;
        const { port, gcode, workflow } = state;
        const canClick = !!port;
        const isReady = canClick && gcode.ready;
        const canRun = this.canRun();
        const { isConnected, fileLoaded } = this.props;
        const showPlayOrTest = isConnected && fileLoaded && canRun;
        const canPause = isReady && includes([WORKFLOW_STATE_RUNNING], workflow.state);
        const canStop = isReady && includes([WORKFLOW_STATE_RUNNING, WORKFLOW_STATE_PAUSED], workflow.state);
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
                    {
                        workflow.state !== WORKFLOW_STATE_RUNNING && (
                            <>
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
                            </>
                        )
                    }
                </div>
                {
                    showPlayOrTest && (
                        <button
                            type="button"
                            className={!canRun ? `${styles['workflow-button-disabled']}` : `${styles['workflow-button-test']}`}
                            title={i18n._('Test Run')}
                            onClick={this.handleTestFile}
                            disabled={!canRun}
                            style={{ writingMode: 'vertical-lr' }}
                        >
                            {i18n._('Test Run')} <i className="fa fa-tachometer-alt" style={{ writingMode: 'horizontal-tb' }} />
                        </button>
                    )
                }
                {
                    showPlayOrTest && (
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

export default connect((store) => {
    const fileLoaded = get(store, 'file.fileLoaded', false);
    const isConnected = get(store, 'connection.isConnected', false);
    return {
        fileLoaded,
        isConnected
    };
})(WorkflowControl);
