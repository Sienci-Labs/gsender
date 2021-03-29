/* eslint-disable no-return-assign */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from 'app/components/Modal';
import map from 'lodash/map';
import controller from '../../lib/controller';
import Controller from '../../widgets/Grbl/Controller';
import Loading from '../../components/Loader';
// import WarningModal from './WarningModals/WarningModal';
import { Toaster, TOASTER_INFO } from '../../lib/toaster/ToasterLib';
import Notification from '../../components/Notification/Notification';
import styles from './index.styl';

class Firmware extends PureComponent {
    static propTypes = {
        modalClose: PropTypes.func
    };

    constructor(props) {
        super(props);

        const defaultFileType = 'text';
        this.fileNames = {
            text: 'Eeprom.txt'
        };
        this.state = {
            fileType: defaultFileType,
            fileDownloadUrl: null,
            status: '',
            data: [controller.settings],
            port: controller.port,
            properFormatFile: false,
            initiateFlashing: false,
            currentlyFlashing: false,
        };
        this.changeFileType = this.changeFileType.bind(this);
        this.download = this.download.bind(this);
        this.upload = this.upload.bind(this);
        this.openFile = this.openFile.bind(this);
    }

    componentDidMount() {
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
    }

    changeFileType(event) {
        const value = event.target.value;
        this.setState({ fileType: value });
    }

    download(event) {
        event.preventDefault();
        // Prepare the file
        let output = JSON.stringify(this.state.data[0].settings);

        // Download it
        const blob = new Blob([output]);
        console.log(blob);
        const fileDownloadUrl = URL.createObjectURL(blob);
        console.log(fileDownloadUrl);
        this.setState({ fileDownloadUrl: fileDownloadUrl },
            () => {
                this.dofileDownload.click();
                URL.revokeObjectURL(fileDownloadUrl); // free up storage--no longer needed.
                this.setState({ fileDownloadUrl: '' });
            });
    }

    upload(event) {
        event.preventDefault();
        this.dofileUpload.click();
    }


    openFile(evt) {
        let status = []; // Status output
        const fileObj = evt.target.files[0];
        const reader = new FileReader();

        let fileloaded = e => {
            // e.target.result is the file's content as text
            const fileContents = e.target.result;
            this.setState({ uploadedSettings: fileContents });
            status.push(`File name: "${fileObj.name}". Length: ${fileContents.length} bytes.`);
            // Show first 80 characters of the file
            const first80char = fileContents.substring(0, 80);
            status.push(`First 80 characters of the file:\n${first80char}`);
            if (first80char[3] !== '0') {
                Toaster.pop({
                    msg: 'Incorrect file format',
                    type: TOASTER_INFO
                });
            } else {
                this.setState({ properFormatFile: true });
            }
            this.setState({ status: status.join('\n') });
        };

        // Mainline of the method
        fileloaded = fileloaded.bind(this);
        reader.onload = fileloaded;
        reader.readAsText(fileObj);
    }

    gcode(cmd, params) {
        const s = map(params, (value, letter) => String(letter + value)).join('=');
        return (s.length > 0) ? (cmd + '' + s) : cmd;
    }

    applySettings = () => {
        let uploadedSettings = this.state.uploadedSettings;
        const obj = JSON.parse(uploadedSettings);
        let values = Object.values(obj);
        if (values.length === 34) {
            for (let i = 0; i < values.length; i++) {
                if (values[i] === true) {
                    values[i] = '1';
                } if (values[i] === false) {
                    values[i] = '0';
                }
            }

            let keys = Object.keys(obj);
            let finalStrings = [];
            const valuesToSubmit = [];
            for (let i = 0; i < keys.length; i++) {
                valuesToSubmit.push([keys[i], values[i]]);
            }
            let gCoded = this.gcode(valuesToSubmit);

            //loops through array values, concatinates them with =
            for (let j = 0; j < gCoded.length; j++) {
                finalStrings[j] = gCoded[j].join('=');
            }
            controller.command('gcode', finalStrings);
            controller.command('gcode', '$$');//Needed so next time wizard is opened changes are reflected
            Toaster.pop({
                msg: 'Eeprom values updated!',
                type: TOASTER_INFO
            });
            this.props.modalClose();
        } else {
            Toaster.pop({
                msg: 'Incorrect file format, please try again',
                type: TOASTER_INFO
            });
        }
    }

    controllerEvents = {
        'message': () => {
            this.setState({ currentlyFlashing: false });
            this.setState({ finishedMessage: `Flashing completed successfully on port: ${this.state.port}!` });
            this.props.modalClose();
            Toaster.pop({
                msg: (this.state.finishedMessage),
                type: 'TOASTER_INFO',
            });
        },
        'error': () => {
            this.setState({ currentlyFlashing: false });
            this.setState({ finishedMessage: 'Error flashing board...' });
            Toaster.pop({
                msg: (this.state.finishedMessage),
                type: 'TOASTER_WARNING',
            });
        },
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({
                port: port
            });
        },
        'serialport:settings': (type) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    settings: Controller.settings
                },
                data: Controller.settings
            }));
        },
        'controller:state': (type, controllerState) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    state: controllerState
                }
            }));
        }
    };

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

    startFlashing=() => {
        this.setState({ initiateFlashing: true });
    }

    stopFlashing=() => {
        this.setState({ initiateFlashing: false });
    }

    actions = {
        startFlash: (port) => {
            Toaster.pop({
                msg: `Flashing started on port: ${this.state.port} `,
                type: 'TOASTER_INFO',
            });
            this.setState({ currentlyFlashing: true });
            controller.command('flash:start', this.state.port);
        }
    }


    render() {
        // console.log(this.state.data[0].settings);
        // console.log(JSON.stringify(this.state.currentlyFlashing));
        // let port = this.state.port;
        const { modalClose } = this.props;
        // const state = { ...this.state };
        // const actions = { ...this.actions };

        return (
            <Modal onClose={modalClose}>
                <h3 className={styles.firmwareHeader}>Firmware Gadget</h3>
                <div className={styles.firmwareContainer}>
                    <div className={styles.grblContainer}>
                        <button
                            type="button"
                            className={styles.firmwareButtons}
                            onClick={this.startFlashing}
                        >Grbl Flash
                        </button>
                        {this.state.initiateFlashing ? (
                            <Notification
                                onClose={modalClose}
                                message="Are you sure you want to return to Grbl default values?"
                                onYes={this.actions.startFlash}
                                stopFlashing={this.stopFlashing}
                            />
                        ) : ''}
                    </div>
                    <div className={styles.settingsContainer} />
                    <div className={styles.buttonsContainer}>
                        {this.state.properFormatFile ? (
                            <Notification
                                onClose={modalClose}
                                message="Are you sure you want to apply these settings?"
                                onYes={this.applySettings}
                            />
                        ) : ''}
                        <button
                            type="button" className={styles.firmwareButtons}
                            onClick={this.upload}
                        >Import Settings...
                        </button>
                        <button type="button" className={styles.firmwareButtons}>Restore Cnc Defaults</button>
                        <button type="button" className={styles.firmwareButtons}>Apply New Settings</button>
                        <button
                            type="button"
                            onClick={this.download}
                            className={styles.firmwareButtons}
                        >
                      Export Settings
                        </button>

                        <a
                            className="hidden"
                            download={this.fileNames[this.state.fileType]}
                            href={this.state.fileDownloadUrl}
                            ref={e => this.dofileDownload = e}
                        >download it
                        </a>

                        <input
                            type="file" className="hidden"
                            multiple={false}
                            accept=".txt"
                            onChange={evt => this.openFile(evt)}
                            ref={e => this.dofileUpload = e}
                        />
                    </div>
                </div>
                {this.state.currentlyFlashing ? <Loading size="lg" overlay={true} /> : ''}
            </Modal>
        );
    }
}

export default Firmware;
