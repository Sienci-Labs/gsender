/* eslint-disable react/jsx-indent */
/* eslint-disable react/jsx-closing-bracket-location */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import controller from 'app/lib/controller';
import WidgetConfig from '../../widgets/WidgetConfig';
import styles from './index.styl';
import * as GRBL_SETTINGS from '../../../server/controllers/Grbl/constants';
import {
    GRBL
} from '../../constants';
import Controller from '../../widgets/Grbl/Controller';
import InputController from './Inputs/InputController';
// import Space from '../../components/Space';

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
        grabNew$23InputSettings: PropTypes.func
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

    getCurrentSettings = () => {
        let LoadedSettings = this.state.settings.settings;
        this.setState({ settings: LoadedSettings });
    }

    render() {
        const loadedSettings = GRBL_SETTINGS.GRBL_SETTINGS;
        let currentSettings = this.state.settings.settings;
        return (
            <div>
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
                                grabNewNumberInputSettings={this.props.grabNewNumberInputSettings}
                                grabNewSwitchInputSettings={this.props.grabNewSwitchInputSettings}
                                grabNew$2InputSettings={this.props.grabNew$2InputSettings}
                                grabNew$3InputSettings={this.props.grabNew$3InputSettings}
                                grabNew$10InputSettings={this.props.grabNew$10InputSettings}
                                grabNew$23InputSettings={this.props.grabNew$23InputSettings}
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
