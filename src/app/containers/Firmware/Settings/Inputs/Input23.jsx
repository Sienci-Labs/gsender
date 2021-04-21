/* eslint-disable brace-style */
/* eslint-disable indent */
/* eslint-disable react/jsx-closing-bracket-location */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleSwitch from 'app/components/ToggleSwitch';
import styles from './index.styl';


class InputTwentyThree extends PureComponent {
    static propTypes = {
        switchSettings: PropTypes.object,
        title: PropTypes.string,
        currentSettings: PropTypes.object,
        grabNew$23InputSettings: PropTypes.func,
        disableSettingsButton: PropTypes.func
    }

    state = this.getInitialState();

    getInitialState() {
        return {
            defaultSettings: [false, false, false],
            usersNewSettings: {},
        };
    }


    getCurrentSettings = () => {
        let loadedSettings = this.props.currentSettings.$23;
        let $23Options = [
            [false, false, false],
            [true, false, false],
            [false, true, false],
            [true, true, false],
            [false, false, true],
            [true, false, true],
            [false, true, true],
            [true, true, true],
        ];

        if (loadedSettings === '0') {
            loadedSettings = $23Options[0];
        }
        if (loadedSettings === '1') {
            loadedSettings = $23Options[1];
        }
        if (loadedSettings === '2') {
            loadedSettings = $23Options[2];
        }
        if (loadedSettings === '3') {
            loadedSettings = $23Options[3];
        }
        if (loadedSettings === '4') {
            loadedSettings = $23Options[4];
        }
        if (loadedSettings === '5') {
            loadedSettings = $23Options[5];
        }
        if (loadedSettings === '6') {
            loadedSettings = $23Options[6];
        }
        if (loadedSettings === '7') {
            loadedSettings = $23Options[7];
        }
        this.setState({
            defaultSettings: loadedSettings
        });
    }

    handleSwitch = (value, name) => {
        let currentValue = [...this.state.defaultSettings];
        if (name === '23-0') {
            currentValue[0] = value;
        }
        if (name === '23-1') {
            currentValue[1] = value;
        }
        if (name === '23-2') {
            currentValue[2] = value;
        }
        this.setState({
            defaultSettings: currentValue
        });

        this.props.disableSettingsButton();
        this.props.grabNew$23InputSettings(name, currentValue);
    }


    render() {
        let [settingsZero, settingsOne, settingsTwo] = this.state.defaultSettings;
        return (
            <div className={styles.controlWrapper}>
                <div className={styles.controlRow}>
                    <div className={styles.maskTwoTitles}>X: </div>
                    <ToggleSwitch checked={settingsZero} onChange={(value) => this.handleSwitch(value, '23-0')} />
                </div>
                <div className={styles.controlRow}>
                    <div className={styles.maskTwoTitles}>Y: </div>
                    <ToggleSwitch checked={settingsOne} onChange={(value) => this.handleSwitch(value, '23-1')} />
                </div>
                <div className={styles.controlRow}>
                    <div className={styles.maskTwoTitles}>Z: </div>
                    <ToggleSwitch checked={settingsTwo} onChange={(value) => this.handleSwitch(value, '23-2')} />
                </div>
            </div>
        );
    }
}

export default InputTwentyThree;
