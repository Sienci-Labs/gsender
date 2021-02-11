/* eslint-disable no-new-wrappers */
import Modal from 'app/components/Modal';
// import map from 'lodash/map';
import Loader from '@trendmicro/react-loader';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import controller from 'app/lib/controller';
import FirmwareSettings from './FirmwareSettings';
import styles from './index.styl';


class WizardModal extends PureComponent {
    state = this.getInitialState();

    static propTypes = {
        modalClose: PropTypes.func
    };

    getInitialState() {
        return {
            selectedMenu: 0,
            menu: [
                {
                    label: '',
                    component: FirmwareSettings
                },
            ]
        };
    }

    actions = {
        setSelectedMenu: (index) => {
            this.setState({
                selectedMenu: index
            });
        },
        grabNewNumberInputSettings: (name, value) => {
            this.setState(prevState => ({
                valuesToApplyToGrbl: {
                    ...prevState.valuesToApplyToGrbl,
                    [name]: value
                }
            }));
        },
        grabNewSwitchInputSettings: (name, value) => {
            this.setState(prevState => ({
                valuesToApplyToGrbl: {
                    ...prevState.valuesToApplyToGrbl,
                    [name]: value
                }
            }));
        },

        grabNew$2InputSettings: (name, allTheValues) => {
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
        },
        grabNew$3InputSettings: (name, allTheValues) => {
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
        },
        grabNew$10InputSettings: (name, bothToggleValues) => {
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
        },
        grabNew$23InputSettings: (name, allTheValues) => {
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

    render() {
        let { usersUpdatedSettings } = this.state;
        const { modalClose } = this.props;
        const state = { ...this.state };
        const actions = { ...this.actions };
        const { menu, selectedMenu } = state;

        return (
            <Modal
                onClose={modalClose}
            >
                <div className={styles.wizardContainer}>
                    <div className={styles.wizardContent}>
                        <div className={styles.wizardMenu}>
                            <h3>Firmware Wizard</h3>
                            <button
                                onClick={this.applyNewSettings}
                                type="button"
                            >Apply New Settings
                            </button>
                            <button
                                onClick={this.restoreSettings}
                                type="button"
                            >Restore Factory Settings
                            </button>
                        </div>
                        <div className={styles.wizardOptions}>
                            {
                                menu.map((menuItem, index) => (
                                    <div key={menuItem}>
                                        <Loader />
                                        { <menuItem.component
                                            actions={actions}
                                            state={state}
                                            active={index === selectedMenu}
                                            getUsersNewSettings={this.getUsersNewSettings}
                                            usersUpdatedSettings={usersUpdatedSettings}
                                            applyNewSettings={this.applyNewSettings}
                                            getCurrentSettings={this.getCurrentSettings}
                                            grabNewNumberInputSettings={this.actions.grabNewNumberInputSettings}
                                            grabNewSwitchInputSettings={this.actions.grabNewSwitchInputSettings}
                                            grabNew$2InputSettings={this.actions.grabNew$2InputSettings}
                                            grabNew$3InputSettings={this.actions.grabNew$3InputSettings}
                                            grabNew$10InputSettings={this.actions.grabNew$10InputSettings}
                                            grabNew$23InputSettings={this.actions.grabNew$23InputSettings}
                                        />}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default WizardModal;
