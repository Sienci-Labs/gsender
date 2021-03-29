/* eslint-disable no-new-wrappers */
/* eslint-disable no-return-assign */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from 'app/components/Modal';
import map from 'lodash/map';
import controller from '../../lib/controller';
import Controller from '../../widgets/Grbl/Controller';
import Loading from '../../components/Loader';
import { Toaster, TOASTER_INFO } from '../../lib/toaster/ToasterLib';
import Notification from '../../components/Notification/Notification';
import styles from './index.styl';
import InputController from './Settings/Inputs/InputController';
import * as GRBL_SETTINGS from '../../../server/controllers/Grbl/constants';

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
            initiateRestoreDefaults: false,
            newSettingsButtonDisabled: true
        };
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

    download(event) {
        event.preventDefault();
        // Prepare the file
        let output = JSON.stringify(this.state.data[0].settings);
        // Download it
        const blob = new Blob([output]);
        const fileDownloadUrl = URL.createObjectURL(blob);
        this.setState({ fileDownloadUrl: fileDownloadUrl },
            () => {
                this.dofileDownload.click();
            });
    }

    upload(event) {
        event.preventDefault();
        this.dofileUpload.click();
    }


    openFile(evt) {
        const fileObj = evt.target.files[0];
        const reader = new FileReader();

        let fileloaded = e => {
            const fileContents = e.target.result;
            this.setState({ uploadedSettings: fileContents });
            const first80char = fileContents.substring(0, 80);
            if (first80char[3] !== '0') {
                Toaster.pop({
                    msg: 'Incorrect file format',
                    type: TOASTER_INFO
                });
            } else {
                this.setState({ properFormatFile: true });
            }
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

    restoreSettings=() => {
        this.setState({ initiateRestoreDefaults: true });
    }

    actions = {
        startFlash: (port) => {
            Toaster.pop({
                msg: `Flashing started on port: ${this.state.port} `,
                type: 'TOASTER_INFO',
            });
            this.setState({ initiateFlashing: false });
            this.setState({ currentlyFlashing: true });
            controller.command('flash:start', this.state.port);
        }
    }

    grabNewSwitchInputSettings = (name, value) => {
        this.setState(prevState => ({
            valuesToApplyToGrbl: {
                ...prevState.valuesToApplyToGrbl,
                [name]: value
            }
        }));
    }

    grabNew$2InputSettings = (name, allTheValues) => {
        let finalValue = '';
        let zero = [0, 0, 0];
        let one = [1, 0, 0];
        let two = [0, 1, 0];
        let three = [1, 1, 0];
        let four = [0, 0, 1];
        let five = [1, 0, 1];
        let six = [0, 1, 1];
        let seven = [1, 1, 1];

        if (new String(zero).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 0;
        }
        if (new String(one).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 1;
        }
        if (new String(two).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 2;
        }
        if (new String(three).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 3;
        }
        if (new String(four).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 4;
        }
        if (new String(five).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 5;
        }
        if (new String(six).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 6;
        }
        if (new String(seven).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 7;
        }

        this.setState(prevState => ({
            valuesToApplyToGrbl: {
                ...prevState.valuesToApplyToGrbl,
                $2: finalValue
            }
        }));
    }

    grabNew$3InputSettings = (name, allTheValues) => {
        let finalValue = '';
        let zero = [0, 0, 0];
        let one = [1, 0, 0];
        let two = [0, 1, 0];
        let three = [1, 1, 0];
        let four = [0, 0, 1];
        let five = [1, 0, 1];
        let six = [0, 1, 1];
        let seven = [1, 1, 1];

        if (new String(zero).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 0;
        }
        if (new String(one).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 1;
        }
        if (new String(two).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 2;
        }
        if (new String(three).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 3;
        }
        if (new String(four).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 4;
        }
        if (new String(five).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 5;
        }
        if (new String(six).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 6;
        }
        if (new String(seven).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 7;
        }
        this.setState(prevState => ({
            valuesToApplyToGrbl: {
                ...prevState.valuesToApplyToGrbl,
                $3: finalValue
            }
        }));
    }


    grabNew$10InputSettings = (name, bothToggleValues) => {
        let finalValue = '';
        let zero = [0, 0];
        let one = [1, 0];
        let two = [0, 1];
        let three = [1, 1];

        if (new String(zero).valueOf() === new String(bothToggleValues).valueOf()) {
            finalValue = 0;
        }
        if (new String(one).valueOf() === new String(bothToggleValues).valueOf()) {
            finalValue = 1;
        }
        if (new String(two).valueOf() === new String(bothToggleValues).valueOf()) {
            finalValue = 2;
        }
        if (new String(three).valueOf() === new String(bothToggleValues).valueOf()) {
            finalValue = 3;
        }

        this.setState(prevState => ({
            valuesToApplyToGrbl: {
                ...prevState.valuesToApplyToGrbl,
                $10: finalValue
            }
        }));
    }

    grabNew$23InputSettings = (name, allTheValues) => {
        let finalValue = '';
        let zero = [0, 0, 0];
        let one = [1, 0, 0];
        let two = [0, 1, 0];
        let three = [1, 1, 0];
        let four = [0, 0, 1];
        let five = [1, 0, 1];
        let six = [0, 1, 1];
        let seven = [1, 1, 1];


        if (new String(zero).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 0;
        }
        if (new String(one).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 1;
        }
        if (new String(two).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 2;
        }
        if (new String(three).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 3;
        }
        if (new String(four).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 4;
        }
        if (new String(five).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 5;
        }
        if (new String(six).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 6;
        }
        if (new String(seven).valueOf() === new String(allTheValues).valueOf()) {
            finalValue = 7;
        }

        this.setState(prevState => ({
            valuesToApplyToGrbl: {
                ...prevState.valuesToApplyToGrbl,
                $23: finalValue
            }
        }));
    }

    grabNewNumberInputSettings = (name, value) => {
        this.setState(prevState => ({
            valuesToApplyToGrbl: {
                ...prevState.valuesToApplyToGrbl,
                [name]: value
            }
        }));
    }

    disableSettingsButton = () => {
        this.setState({ newSettingsButtonDisabled: false });
    }

    applyNewSettings = () => {
        let numbersValues = this.state.valuesToApplyToGrbl;
        let values = Object.values(numbersValues);
        let keys = Object.keys(numbersValues);
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
        this.props.modalClose();
        Toaster.pop({
            msg: 'Settings Updated!',
            type: TOASTER_INFO
        });
    }

    render() {
        const { modalClose } = this.props;
        const loadedSettings = GRBL_SETTINGS.GRBL_SETTINGS;
        // console.log(JSON.stringify(this.state.data[0].settings));
        let currentSettings = this.state.data[0].settings;
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
                                message={`This feature exists to flash the GRBL firmware onto compatible Arduino boards only! Are you sure youd like to wipe, and reflash the device on ${this.state.port} with GRBL 1.1h with its default settings?`}
                                onYes={this.actions.startFlash}
                                stopFlashing={this.stopFlashing}
                            />
                        ) : ''}
                    </div>
                    <div className={styles.settingsContainer}>
                        {loadedSettings.map((grbl) => (
                            <div key={grbl.setting} className={styles.containerFluid}>
                                <div className={styles.tableRow}>
                                    <div className={styles.keyRow}>{grbl.setting}</div>
                                    <div className={styles.itemText}>{grbl.message}</div>
                                    <InputController
                                        type={grbl.inputType}
                                        title={grbl.setting}
                                        currentSettings={currentSettings}
                                        getUsersNewSettings={this.props.getUsersNewSettings}
                                        switchSettings={this.state.settings}
                                        min={grbl.min}
                                        max={grbl.max}
                                        step={grbl.step}
                                        grabNewNumberInputSettings={this.grabNewNumberInputSettings}
                                        grabNewSwitchInputSettings={this.grabNewSwitchInputSettings}
                                        grabNew$2InputSettings={this.grabNew$2InputSettings}
                                        grabNew$3InputSettings={this.grabNew$3InputSettings}
                                        grabNew$10InputSettings={this.grabNew$10InputSettings}
                                        grabNew$23InputSettings={this.grabNew$23InputSettings}
                                        units={grbl.units}
                                        disableSettingsButton={this.disableSettingsButton}
                                    />

                                </div>
                                <div className={styles.descriptionRow}>{grbl.description}</div>
                            </div>
                        ))
                        }
                    </div>
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
                        {this.state.initiateRestoreDefaults ? (
                            <Notification
                                onClose={modalClose}
                                message="Pick a profile to restore to"
                                // onYes={this.actions.startFlash}
                                // stopFlashing={this.stopFlashing}
                            />
                        ) : ''}
                        <button type="button" className={styles.firmwareButtons} onClick={this.restoreSettings}>Restore Cnc Defaults</button>
                        <button
                            type="button"
                            onClick={this.applyNewSettings}
                            className={this.state.newSettingsButtonDisabled ? `${styles.firmwareButtonDisabled}` : `${styles.firmwareButtons}`}
                        > Apply New Settings
                        </button>
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
