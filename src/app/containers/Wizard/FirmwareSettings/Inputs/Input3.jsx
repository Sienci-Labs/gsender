/* eslint-disable brace-style */
/* eslint-disable indent */
/* eslint-disable react/jsx-closing-bracket-location */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
// import Space from 'app/components/Space';
import styles from './index.styl';

class MaskInputThree extends PureComponent {
    static propTypes = {
        switchSettings: PropTypes.object,
        title: PropTypes.string,
        currentSettings: PropTypes.object,
        grabNew$3InputSettings: PropTypes.func
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
        let loadedSettings = this.props.currentSettings.$3;
        let $3Options = [
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
            loadedSettings = $3Options[0];
            this.setState({ zero: false });
            this.setState({ one: false });
            this.setState({ two: false });
        }
        if (loadedSettings === '1') {
            loadedSettings = $3Options[1];
            this.setState({ zero: true });
            this.setState({ one: false });
            this.setState({ two: false });
        }
        if (loadedSettings === '2') {
            loadedSettings = $3Options[2];
            this.setState({ zero: false });
            this.setState({ one: true });
            this.setState({ two: false });
        }
        if (loadedSettings === '3') {
            loadedSettings = $3Options[3];
            this.setState({ zero: true });
            this.setState({ one: true });
            this.setState({ two: false });
        }
        if (loadedSettings === '4') {
            loadedSettings = $3Options[4];
            this.setState({ zero: false });
            this.setState({ one: false });
            this.setState({ two: true });
        }
        if (loadedSettings === '5') {
            loadedSettings = $3Options[5];
            this.setState({ zero: true });
            this.setState({ one: false });
            this.setState({ two: true });
        }
        if (loadedSettings === '6') {
            loadedSettings = $3Options[6];
            this.setState({ zero: false });
            this.setState({ one: true });
            this.setState({ two: true });
        }
        if (loadedSettings === '7') {
            loadedSettings = $3Options[7];
            this.setState({ zero: true });
            this.setState({ one: true });
            this.setState({ two: true });
        }
        this.setState({ defaultSettings: loadedSettings });
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
        if (currentValue[2] === true) {
            currentValue[2] = 1;
        } else if (currentValue[2] === false) {
            currentValue[2] = 0;
        }

        if (value === true) {
            value = 1;
        }
        if (value === false) {
            value = 0;
        }

        if (name === '3-0') {
            currentValue[0] = value;
        }
        if (name === '3-1') {
            currentValue[1] = value;
        }
        if (name === '3-2') {
            currentValue[2] = value;
        }

        this.props.grabNew$3InputSettings(name, currentValue);
    }


    render() {
        let settingsZero = this.state.defaultSettings[0];
        let settingsOne = this.state.defaultSettings[1];
        let settingsTwo = this.state.defaultSettings[2];
        return (
            <div className={styles.maskTwo}>
                <div className={styles.maskTwoTitles}>X: </div>
                <div className={styles.threeToggles}>
                    <div className={styles.onoffswitch}>
                        <input
                            type="checkbox"
                            name="3-0"
                            className={styles.onoffswitchcheckbox}
                            id="3-0"
                            tabIndex="0"
                            onClick={this.handleSwitch}
                            defaultChecked={settingsZero}
                        />
                        <label className={styles.onoffswitchlabel} htmlFor="3-0" />
                    </div>
                </div>
                <div className={styles.maskTwoTitles}>Y: </div>
                <div className={styles.threeToggles}>
                    <div className={styles.onoffswitch}>
                        <input
                            type="checkbox"
                            name="3-1"
                            className={styles.onoffswitchcheckbox}
                            id="3-1"
                            tabIndex="0"
                            onClick={this.handleSwitch}
                            defaultChecked={settingsOne}
                        />
                        <label className={styles.onoffswitchlabel} htmlFor="3-1" />
                    </div>
                </div>
                <div className={styles.maskTwoTitles}>Z: </div>
                <div className={styles.threeToggles}>
                    <div className={styles.onoffswitch}>
                        <input
                            type="checkbox"
                            name="3-2"
                            className={styles.onoffswitchcheckbox}
                            id="3-2"
                            tabIndex="0"
                            onClick={this.handleSwitch}
                            defaultChecked={settingsTwo}
                        />
                        <label className={styles.onoffswitchlabel} htmlFor="3-2" />
                    </div>
                </div>
            </div>
        );
    }
}

export default MaskInputThree;
