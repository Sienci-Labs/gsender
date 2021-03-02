/* eslint-disable brace-style */
/* eslint-disable indent */
/* eslint-disable react/jsx-closing-bracket-location */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
// import Space from 'app/components/Space';
import styles from './index.styl';

class InputTen extends PureComponent {
    static propTypes = {
        switchSettings: PropTypes.object,
        title: PropTypes.string,
        currentSettings: PropTypes.object,
        getUsersNewSettings: PropTypes.func,
        grabNew$10InputSettings: PropTypes.func,
        disableSettingsButton: PropTypes.func
    }

    state = this.getInitialState();

    getInitialState() {
        return {
            defaultSettings: '',
            usersNewSettings: {},
        };
    }


    componentDidMount = () => {
        this.getCurrentSettings();
    }

    getCurrentSettings = () => {
        let loadedSetting = this.props.currentSettings.$10;
        let $10Options = [
            [false, false], //$10=0
            [true, false],
            [false, true],
            [true, true],

        ];

        if (loadedSetting === '0') {
            loadedSetting = $10Options[0];
            this.setState({ zero: false });
            this.setState({ one: false });
        }
        if (loadedSetting === '1') {
            loadedSetting = $10Options[1];
            this.setState({ zero: true });
            this.setState({ one: false });
        }
        if (loadedSetting === '2') {
            loadedSetting = $10Options[2];
            this.setState({ zero: false });
            this.setState({ one: true });
        }
        if (loadedSetting === '3') {
            loadedSetting = $10Options[3];
            this.setState({ zero: true });
            this.setState({ one: true });
        }
        this.setState({ defaultSettings: loadedSetting });
    }

    handleSwitch = (event) => {
        let value = event.target.checked;
        let name = event.target.name;
        let currentValue = this.state.defaultSettings;
        if (currentValue[0] === true) {
            currentValue[0] = 1;
        } else if (currentValue[0] === false) {
            currentValue[0] = 0;
        }
        if (currentValue[1] === true) {
            currentValue[1] = 1;
        } else if (currentValue[1] === false) {
            currentValue[1] = 0;
        }

        if (value === true) {
            value = 1;
        }
        if (value === false) {
            value = 0;
        }

        if (name === '10-0') {
            currentValue[0] = value;
        }
        if (name === '10-1') {
            currentValue[1] = value;
        }
        this.props.disableSettingsButton();
        this.props.grabNew$10InputSettings(name, currentValue);
    }


    render() {
        let settingsZero = this.state.defaultSettings[0];
        let settingsOne = this.state.defaultSettings[1];
        return (
            <div className={styles.maskTwo}>
                <div className={styles.toggleTitles}>WPosition </div>
                <div className={styles.threeToggles}>
                    <div className={styles.onoffswitch}>
                        <input
                            type="checkbox"
                            name="10-0"
                            className={styles.onoffswitchcheckbox}
                            id="10-0"
                            tabIndex="0"
                            onClick={this.handleSwitch}
                            defaultChecked={settingsZero}
                        />
                        <label className={styles.onoffswitchlabel} htmlFor="10-0" />
                    </div><div className={styles.mPos}>MPosition </div>
                </div>
                <div className={styles.toggleTitles}>Buffer </div>
                <div className={styles.threeToggles}>
                    <div className={styles.onoffswitch}>
                        <input
                            type="checkbox"
                            name="10-1"
                            className={styles.onoffswitchcheckbox}
                            id="10-1"
                            tabIndex="0"
                            onClick={this.handleSwitch}
                            defaultChecked={settingsOne}
                        />
                        <label className={styles.onoffswitchlabel} htmlFor="10-1" />
                    </div>
                </div>
            </div>
        );
    }
}

export default InputTen;
