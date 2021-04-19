/* eslint-disable brace-style */
/* eslint-disable indent */
/* eslint-disable react/jsx-closing-bracket-location */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
// import Space from 'app/components/Space';
import MaskInputTwo from './Input2';
import MaskInputThree from './Input3';
import MaskInputTen from './Input10';
import MaskInputTwentyThree from './Input23';
import NumberInputs from './NumberInputs';
import SwitchInput from './SwitchInputs';

class InputController extends PureComponent {
    static propTypes = {
        title: PropTypes.string,
        type: PropTypes.string,
        currentSettings: PropTypes.object,
        getUsersNewSettings: PropTypes.func,
        switchSettings: PropTypes.object,
        min: PropTypes.number,
        max: PropTypes.number,
        step: PropTypes.number,
        grabNewNumberInputSettings: PropTypes.func,
        grabNewSwitchInputSettings: PropTypes.func,
        grabNew$2InputSettings: PropTypes.func,
        grabNew$3InputSettings: PropTypes.func,
        grabNew$10InputSettings: PropTypes.func,
        grabNew$23InputSettings: PropTypes.func,
        units: PropTypes.string,
        disableSettingsButton: PropTypes.func
    }

    render() {
        let currentSettings = this.props.currentSettings;
        let title = this.props.title;
        let min = this.props.min;
        let max = this.props.max;
        let step = this.props.step;
        if (this.props.type === 'number') {
            return (
                <NumberInputs
                    name={title}
                    title={title}
                    min={min}
                    max={max}
                    step={step}
                    currentSettings={currentSettings}
                    getUsersNewSettings={this.props.getUsersNewSettings}
                    grabNewNumberInputSettings={this.props.grabNewNumberInputSettings}
                    units={this.props.units}
                    disableSettingsButton={this.props.disableSettingsButton}
                />
            );
        } else if (this.props.type === 'switch') {
            return (
                <SwitchInput
                    name={title}
                    switchSettings={this.props.switchSettings}
                    currentSettings={currentSettings}
                    title={title}
                    getUsersNewSettings={this.props.getUsersNewSettings}
                    grabNewSwitchInputSettings={this.props.grabNewSwitchInputSettings}
                    disableSettingsButton={this.props.disableSettingsButton}
                />
            );
        } else if (this.props.type === 'mask2') {
            return (
                <MaskInputTwo
                    name={title}
                    switchSettings={this.props.switchSettings}
                    currentSettings={currentSettings}
                    title={title}
                    getUsersNewSettings={this.props.getUsersNewSettings}
                    grabNew$2InputSettings={this.props.grabNew$2InputSettings}
                    disableSettingsButton={this.props.disableSettingsButton}
                    />
            );
        } else if (this.props.type === 'mask3') {
            return (
                <MaskInputThree
                    name={title}
                    switchSettings={this.props.switchSettings}
                    currentSettings={currentSettings}
                    title={title}
                    getUsersNewSettings={this.props.getUsersNewSettings}
                    grabNew$3InputSettings={this.props.grabNew$3InputSettings}
                    disableSettingsButton={this.props.disableSettingsButton}
                    />
            );
        } else if (this.props.type === 'mask10') {
            return (
                <MaskInputTen
                    name={title}
                    switchSettings={this.props.switchSettings}
                    currentSettings={currentSettings}
                    title={title}
                    getUsersNewSettings={this.props.getUsersNewSettings}
                    grabNew$10InputSettings={this.props.grabNew$10InputSettings}
                    disableSettingsButton={this.props.disableSettingsButton}
                    />
            );
        } else if (this.props.type === 'mask23') {
            return (
                <MaskInputTwentyThree
                    name={title}
                    switchSettings={this.props.switchSettings}
                    currentSettings={currentSettings}
                    title={title}
                    getUsersNewSettings={this.props.getUsersNewSettings}
                    grabNew$23InputSettings={this.props.grabNew$23InputSettings}
                    disableSettingsButton={this.props.disableSettingsButton}
                    />
            );
        }
        return (
            <div> Error Loading inputs</div>
        );
    }
}

export default InputController;
