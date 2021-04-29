import get from 'lodash/get';
import includes from 'lodash/includes';
import pick from 'lodash/pick';
import PropTypes from 'prop-types';
import isElectron from 'is-electron';
import controller from 'app/lib/controller';
import React, { PureComponent } from 'react';
import i18n from 'app/lib/i18n';
import log from 'app/lib/log';
import { Toaster, TOASTER_UNTIL_CLOSE, TOASTER_DANGER } from '../../lib/toaster/ToasterLib';
import CameraDisplay from './CameraDisplay/CameraDisplay';
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
            fileLoaded: true
        };
    }

    handleClickUpload = (event) => {
        this.fileInputEl.value = null;
        this.fileInputEl.click();
    };

    handleChangeFile = (event) => {
        const { actions } = this.props;
        const files = event.target.files;
        const file = files[0];
        const reader = new FileReader();

        if (isElectron()) {
            const recentFile = createRecentFileFromRawPath(file.path, file.name);
            addRecentFile(recentFile);
        }

        reader.onloadend = (event) => {
            const { result, error } = event.target;

            if (error) {
                log.error(error);
                return;
            }

            log.debug('FileReader:', pick(file, [
                'lastModified',
                'lastModifiedDate',
                'meta',
                'name',
                'size',
                'type'
            ]));

            const meta = {
                name: file.name,
                size: file.size
            };
            actions.uploadFile(result, meta);
        };

        try {
            reader.readAsText(file);
        } catch (err) {
            // Ignore error
        }
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
