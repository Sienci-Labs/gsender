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

/* eslint-disable no-return-assign */
/* eslint-disable no-new-wrappers */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'app/components/Modal';
import map from 'lodash/map';
import get from 'lodash/get';
import download from 'downloadjs';
import store from 'app/store';
import { GRBL } from 'app/constants';
import TooltipCustom from '../../components/TooltipCustom/ToolTip';
import controller from '../../lib/controller';
import Loading from '../../components/Loader';
import { Toaster, TOASTER_INFO } from '../../lib/toaster/ToasterLib';
import ToolsNotificationModal from '../../components/ToolsNotificationModal/Modal';
import styles from './index.styl';
import InputController from './Settings/Inputs/InputController';
import * as GRBL_SETTINGS from '../../../server/controllers/Grbl/constants';
import NotConnectedWarning from './NotConnectedWarning';
import WidgetConfig from '../../widgets/WidgetConfig';
import ToolModalButton from '../../components/ToolModalButton/ToolModalButton';


class Firmware extends PureComponent {
    static propTypes = {
        modalClose: PropTypes.func
    };

    connectionConfig = new WidgetConfig('connection');

    constructor(props) {
        super(props);

        const defaultFileType = 'text';
        this.fileNames = {
            text: 'My Cnc Settings.txt'
        };
        this.state = {
            fileType: defaultFileType,
            fileDownloadUrl: null,
            status: '',
            data: controller.settings,
            port: controller.port,
            properFormatFile: false,
            initiateFlashing: false,
            currentlyFlashing: false,
            initiateRestoreDefaults: false,
            newSettingsButtonDisabled: true,
            currentMachineProfile: '',
            loadingSettings: false,
            valuesToApplyToGrbl: {}
        };
        this.download = this.download.bind(this);
        this.upload = this.upload.bind(this);
        this.openFile = this.openFile.bind(this);
    }

    componentDidMount() {
        this.addControllerEvents();
        this.actions.getProfiles();
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
        this.setState({ fileDownloadUrl: fileDownloadUrl });
        download(blob, 'My Cnc Settings', '');
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
        this.setState({ properFormatFile: false });
    }

    controllerEvents = {
        'message': () => {
            this.setState({ currentlyFlashing: false });
            this.setState({ finishedMessage: `Flashing completed successfully on port: ${this.state.port}! Please reconnect your machine` });
            this.props.modalClose();
            Toaster.pop({
                msg: (this.state.finishedMessage),
                type: 'TOASTER_INFO',
            });
        },
        'task:error': (error) => {
            let errorNumber = error.errno;
            let errorCode = error.code;
            let errorMessage = `Error flashing board...Error Number: ${errorNumber} Error Code: ${errorCode}. If problem persists, please contact support`;
            this.setState({ currentlyFlashing: false });
            this.setState({ finishedMessage: errorMessage });
            Toaster.pop({
                msg: (this.state.finishedMessage),
                type: 'TOASTER_UNTIL_CLOSE',
                duration: 10000
            });
        },
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({
                port: port,
                loadingSettings: true
            }, controller.command('gcode', '$$'));
        },
        'serialport:settings': (type) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    settings: controller.settings
                },
                data: controller.settings,
                loadingSettings: false
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
        },
        'sender:status': (currentMachineProfile) => {
            this.setState(state => ({
                currentMachineProfile: currentMachineProfile
            }));
        },
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
        applySettings: () => {
            let nameOfMachine = this.state.currentMachineProfile.name;
            let typeOfMachine = this.state.currentMachineProfile.type;
            controller.command('firmware:applyProfileSettings', nameOfMachine, typeOfMachine, this.state.port);
            this.props.modalClose();
            Toaster.pop({
                msg: (`${nameOfMachine} ${typeOfMachine} settings updated!`),
                type: 'TOASTER_INFO',
            });
            this.setState({ initiateRestoreDefaults: false });
        },
        startFlash: (port) => {
            Toaster.pop({
                msg: `Flashing started on port: ${this.state.port} `,
                type: 'TOASTER_INFO',
                duration: 15000
            });
            this.setState({ initiateFlashing: false });
            this.setState({ currentlyFlashing: true });
            controller.command('gcode', '$RST=$');
            controller.command('flash:start', this.state.port);
        },
        formatText: (files) => {
            let string;
            let formatted = [];
            files.forEach((e) => {
                string = e.toString().split('.').slice(0, -1).join('.');
                formatted.push(string);
            });
            this.setState({ loadedMachines: formatted });
            this.setState({ showHeader: true });
            this.setState({ showstartButton: false });
        },
        getProfiles: () => {
            let machine = store.get('workspace.machineProfile');
            this.setState({ currentMachineProfile: machine });
            let machines = ['Sienci Long Mill.txt', 'Sienci Mill One.txt'];
            this.actions.formatText(machines);
        },
        connectToLastDevice: () => {
            const port = this.connectionConfig.get('port');
            const baud = this.connectionConfig.get('baudrate');
            this.reconnectToLastDevice(port, baud, GRBL);
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


    grabNew$10InputSettings = (name, values) => {
        let sum = 0;
        let [mpos, buffer] = values;
        const { valuesToApplyToGrbl } = this.state;

        sum += mpos ? 1 : 0;
        sum += buffer ? 2 : 0;
        valuesToApplyToGrbl[name] = sum;

        this.setState(prevState => ({
            valuesToApplyToGrbl: {
                ...prevState.valuesToApplyToGrbl,
                ...valuesToApplyToGrbl
            }
        }));
    }

    handleShiftedValues = (name, values) => {
        let sum = 0;
        const { valuesToApplyToGrbl } = this.state || {};

        const [x, y, z] = values;
        sum += x ? 1 : 0;
        sum += y ? 2 : 0;
        sum += z ? 4 : 0;

        valuesToApplyToGrbl[name] = sum;
        this.setState(prevState => ({
            valuesToApplyToGrbl: {
                ...prevState.valuesToApplyToGrbl,
                ...valuesToApplyToGrbl
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
        Toaster.pop({
            msg: 'Settings Updated!',
            type: TOASTER_INFO
        });
        this.setState({
            currentSettings: finalStrings,
            newSettingsButtonDisabled: true
        });
    }

    defineMessageForCncDefaultsButton = () => {
        let name = this.state.currentMachineProfile.name;
        let type = this.state.currentMachineProfile.type;
        let message = '';
        if (name === 'Mill One') {
            message = `Are you sure you want to restore your ${name} ${type} back to its default state?`;
        } else if (name === 'LongMill') {
            message = `Are you sure you want to restore your ${name} ${type} back to its default state??`;
        } else {
            message = `We dont have the default settings for your ${name} ${type}. Would you 
            like to Restore your machine to the Grbl defaults?`;
        }
        return message;
    }

    controllerSettingsLoaded () {
        const { settings } = controller.settings;
        if (settings) {
            return (Object.keys(settings).length > 0);
        }
        return false;
    }

    reconnectToLastDevice(port, baudrate, controllerType) {
        controller.openPort(port, {
            controllerType: controllerType,
            baudrate: baudrate,
            rtscts: false
        }, (err) => {
            if (err) {
                return;
            }
        });
    }

    render() {
        const { modalClose, canClick } = this.props;
        const loadedSettings = GRBL_SETTINGS.GRBL_SETTINGS;
        let message = this.defineMessageForCncDefaultsButton();
        let currentSettings = controller.settings;
        let haveSettings = this.controllerSettingsLoaded();

        return (
            <Modal onClose={modalClose}>
                <div className={styles.toolModal}>
                    <div className={styles.firmwareHeader}><h3 className={styles.firmwareHeaderText}>Firmware Gadget</h3></div>
                    <div className={styles.firmwareContainer}>
                        <div className={styles.settingsContainer}>
                            {
                                !haveSettings && <NotConnectedWarning handleConnect={() => this.actions.connectToLastDevice()} />
                            }
                            {haveSettings && loadedSettings.map((grbl) => (
                                <div key={grbl.setting} className={styles.containerFluid}>
                                    <div className={styles.tableRow}>
                                        <div className={styles.settingsInformation}>
                                            <div className={styles.keyRow}>{grbl.setting}</div>
                                            <div className={styles.settingsDescription}>
                                                <div className={styles.itemText}>{grbl.message}</div>
                                                <div className={styles.descriptionRow}>{grbl.description}</div>
                                            </div>
                                        </div>
                                        <div className={styles.settingsControl}>
                                            <InputController
                                                type={grbl.inputType}
                                                title={grbl.setting}
                                                currentSettings={currentSettings.settings}
                                                getUsersNewSettings={this.props.getUsersNewSettings}
                                                switchSettings={this.state.settings}
                                                min={grbl.min}
                                                max={grbl.max}
                                                step={grbl.step}
                                                grabNewNumberInputSettings={this.grabNewNumberInputSettings}
                                                grabNewSwitchInputSettings={this.grabNewSwitchInputSettings}
                                                grabNew$10InputSettings={this.grabNew$10InputSettings}
                                                handleShiftedValues={this.handleShiftedValues}
                                                units={grbl.units}
                                                disableSettingsButton={this.disableSettingsButton}
                                            />
                                        </div>
                                    </div>

                                </div>
                            ))
                            }
                        </div>
                        <div className={styles.buttonsContainer}>
                            <div className={styles.buttonsTop}>
                                {this.state.initiateFlashing ? (
                                    <ToolsNotificationModal
                                        title="Grbl Flashing"
                                        onClose={() => this.setState({ initiateFlashing: false })}
                                        show={this.state.initiateFlashing}
                                        footer="This process will disconnect your machine, and may take a couple minutes to complete."
                                        footerTwo="Continue?"
                                        yesFunction={this.actions.startFlash}
                                    >
                                        This feature exists to flash the GRBL firmware onto compatible Arduino boards only!
                                        Improper flashing could damage your device on port: {this.state.port}.
                                    </ToolsNotificationModal>
                                ) : ''}
                                <TooltipCustom content="Flash your Arduino board to GRBL default values" location="default">
                                    <ToolModalButton icon="fas fa-bolt" onClick={this.startFlashing}>
                                    Flash GRBL
                                    </ToolModalButton>
                                </TooltipCustom>
                                {this.state.initiateRestoreDefaults ? (
                                    <ToolsNotificationModal
                                        title="Restore Cnc Defaults"
                                        onClose={() => this.setState({ initiateRestoreDefaults: false })}
                                        show={this.state.initiateRestoreDefaults}
                                        footer="Restore your Cnc machine?"
                                        yesFunction={this.actions.applySettings}
                                    >
                                        {message}
                                    </ToolsNotificationModal>
                                ) : ''}
                            </div>
                            {this.state.properFormatFile ? (
                                <ToolsNotificationModal
                                    title="Import Settings"
                                    onClose={() => this.setState({ properFormatFile: false })}
                                    show={this.state.properFormatFile}
                                    footer="Are you sure you want to apply these settings?"
                                    yesFunction={this.applySettings}
                                >
                                    This will change your Grbl settings.
                                </ToolsNotificationModal>
                            ) : ''}
                            <div className={styles.buttonsMiddle}>
                                <TooltipCustom content="Import your settings file you saved previously" location="default">
                                    <ToolModalButton onClick={this.upload} icon="fas fa-file-import" disabled={canClick}>
                                    Import Settings
                                    </ToolModalButton>
                                </TooltipCustom>
                                <TooltipCustom content="Save your current GRBL settings to your device" location="default">
                                    <ToolModalButton
                                        onClick={this.download}
                                        icon="fas fa-file-export"
                                        disabled={canClick}
                                    >
                                    Export Settings
                                    </ToolModalButton>
                                </TooltipCustom>
                                <TooltipCustom content="Restore the settings for your current machine profile" location="default">
                                    <ToolModalButton
                                        onClick={this.restoreSettings}
                                        icon="fas fa-undo"
                                        disabled={canClick}
                                    >
                                    Restore Defaults
                                    </ToolModalButton>
                                </TooltipCustom>
                            </div>
                            <a
                                action="Eeprom.txt"
                                className="hidden"
                                download={this.fileNames[this.state.fileType]}
                                href={this.state.fileDownloadUrl}
                                ref={e => this.dofileDownload = e}
                            >download it
                            </a>
                            <TooltipCustom content="Apply your new changes to the settings" location="default" disabled={this.state.newSettingsButtonDisabled}>
                                <ToolModalButton
                                    icon="fas fa-tasks"
                                    onClick={this.applyNewSettings}
                                    className={this.state.newSettingsButtonDisabled ? `${styles.firmwareButtonDisabled}` : `${styles.applySettingsButton}`}
                                    disabled={canClick}
                                >
                                Apply New Settings
                                </ToolModalButton>
                            </TooltipCustom>
                            <input
                                type="file" className="hidden"
                                multiple={false}
                                accept=".txt"
                                onChange={evt => this.openFile(evt)}
                                ref={e => this.dofileUpload = e}
                            />
                        </div>
                    </div>
                </div>

                {this.state.currentlyFlashing ? <Loading size="lg" overlay={true} /> : ''}
            </Modal>
        );
    }
}


export default connect((store) => {
    const isConnected = get(store, 'connection.isConnected');
    return {
        canClick: !isConnected
    };
})(Firmware);
