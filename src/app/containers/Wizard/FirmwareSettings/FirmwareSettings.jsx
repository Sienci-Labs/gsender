/* eslint-disable no-new-wrappers */
/* eslint-disable indent */
/* eslint-disable import/no-useless-path-segments */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import controller from '../../../lib/controller';
import WidgetConfig from '../../../widgets/WidgetConfig';
import styles from '../index.styl';
import * as GRBL_SETTINGS from '../../../../server/controllers/Grbl/constants';
import {
    GRBL
} from '../../../constants';
import Controller from '../../../widgets/Grbl/Controller';
import InputController from './Inputs/InputController';

class FirmwareSettings extends PureComponent {
    static propTypes = {
        getUsersNewSettings: PropTypes.func,
        getCurrentSettings: PropTypes.func,
        usersUpdatedSettings: PropTypes.object,
        applyNewSettings: PropTypes.func,
        checkForThreeUpdates: PropTypes.func,
        grabNewNumberInputSettings: PropTypes.func,
        grabNewSwitchInputSettings: PropTypes.func,
        grabNew$2InputSettings: PropTypes.func,
        grabNew$3InputSettings: PropTypes.func,
        grabNew$10InputSettings: PropTypes.func,
        grabNew$23InputSettings: PropTypes.func,
        active: PropTypes.bool,
        state: PropTypes.object,
        actions: PropTypes.object,
        modalClose: PropTypes.func
    };

    config = new WidgetConfig('1');

    state = this.getInitialState();

    settings = GRBL_SETTINGS.GRBL_SETTINGS;

    controllerEvents = {
        'serialport:open': (options) => {
            const { port, controllerType } = options;
            this.setState({
                isReady: controllerType === GRBL,
                port: port
            });
        },
        'serialport:close': (options) => {
            const initialState = this.getInitialState();
            this.setState({ ...initialState });
        },
        'serialport:settings': (type, controllerSettings) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: type,
                    settings: Controller.settings
                }
            }));
        },
        'controller:state': (type, controllerState) => {
            if (type === GRBL) {
                this.setState(state => ({
                    controller: {
                        ...state.controller,
                        type: type,
                        state: controllerState
                    }
                }));
            }
        }
    };

    componentDidMount() {
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
    }

    getInitialState() {
        return {
            usersUpdatedSettings: this.props.usersUpdatedSettings,
            usersNewSettings: {},
            isReady: (controller.loadedControllers.length === 1) || (controller.type === GRBL),
            port: controller.port,
            settings: controller.settings,
            controller: {
                type: controller.type,
                settings: controller.settings,
                state: controller.state
            }
        };
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
            this.getCurrentSettings();
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    getUsersNewSettings = (settings) => {
        this.setState({ usersUpdatedSettings: settings });
    }

    //Erases and restores the $$ Grbl settings back to defaults
    //which is defined by the default settings file used when compiling Grbl
    restoreSettings = () => {
        controller.command('gcode', '$RST=$');
        controller.command('gcode', '$$');
        this.props.modalClose();
    }

    getCurrentSettings = () => {
        let LoadedSettings = this.state.settings.settings;
        this.setState({ settings: LoadedSettings });
    }

    applyNewSettings = () => {
        let numbersValues = this.state.valuesToApplyToGrbl;
        let values = Object.values(numbersValues);
        let keys = Object.keys(numbersValues);
        const valuesToSubmit = [];
        for (let i = 0; i < keys.length; i++) {
            valuesToSubmit.push([keys[i], values[i]]);
        }

        //loops through array values, concatinates them with = and submits them to controller
        for (let j = 0; j < valuesToSubmit.length; j++) {
            let finalStrings = valuesToSubmit[j].join('=');
            controller.command('gcode', finalStrings);
        }
        controller.command('gcode', '$$');//Needed so nexttime wizard is opened changes are reflected
        this.props.modalClose();
    }

    grabNewNumberInputSettings = (name, value) => {
        this.setState(prevState => ({
            valuesToApplyToGrbl: {
                ...prevState.valuesToApplyToGrbl,
                [name]: value
            }
        }));
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

    render() {
        const loadedSettings = GRBL_SETTINGS.GRBL_SETTINGS;
        let currentSettings = this.state.settings.settings;
        return (
            <div className={classNames(
                styles.hidden,
                styles.settingsContainer,
                { [styles.visible]: this.props.active }
            )}
            >
                <div className={styles.firmwareSettingsButtons}>
                    <button
                        onClick={this.applyNewSettings}
                        type="button"
                        className={styles.wizardButtons}
                    >
                        Apply New Settings
                    </button>
                    <button
                        onClick={this.restoreSettings}
                        type="button"
                        className={styles.wizardButtons}
                    >
                        Restore Factory Settings
                    </button>
                </div>
                <h3>
                    Firmware Settings
                </h3>
                <div> {loadedSettings.map((grbl) => (
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
                            />

                        </div>
                        <div className={styles.descriptionRow}>
                            <div>{grbl.description}</div>
                        </div>
                    </div>
                ))
                }
                </div>
            </div>
        );
    }
}

export default FirmwareSettings;
