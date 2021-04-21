/* eslint-disable brace-style */
/* eslint-disable indent */
/* eslint-disable react/jsx-closing-bracket-location */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleSwitch from 'app/components/ToggleSwitch';
import styles from './index.styl';


class BitShiftInput extends PureComponent {
    static propTypes = {
        switchSettings: PropTypes.object,
        title: PropTypes.string,
        currentSettings: PropTypes.object,
        handleShiftedValues: PropTypes.func,
        disableSettingsButton: PropTypes.func
    }

    state = this.getInitialState();

    getInitialState() {
        return {
            settings: [false, false, false], // X Y Z
        };
    }

    handleSwitch(value, index) {
        const settings = [...this.state.settings];
        const { handleShiftedValues, title, disableSettingsButton } = this.props;
        settings[index] = value;
        this.setState({
            settings: settings
        });
        handleShiftedValues(title, settings);
        disableSettingsButton();
    }

    convertValueToArray() {
        const { title } = this.props;
        let values = [
            [false, false, false],
            [true, false, false],
            [false, true, false],
            [true, true, false],
            [false, false, true],
            [true, false, true],
            [false, true, true],
            [true, true, true],
        ];
        const settings = this.props.currentSettings[title];
        let index = Number(settings);
        this.setState({
            settings: values[index]
        });
    }

    componentDidMount() {
        this.convertValueToArray();
    }

    render() {
        let [X, Y, Z] = this.state.settings;
        return (
            <div className={styles.controlWrapper}>
                <div className={styles.controlRow}>
                    <div className={styles.maskTwoTitles}>X: </div>
                    <ToggleSwitch checked={X} onChange={(value) => this.handleSwitch(value, 0)} />
                </div>
                <div className={styles.controlRow}>
                    <div className={styles.maskTwoTitles}>Y: </div>
                    <ToggleSwitch checked={Y} onChange={(value) => this.handleSwitch(value, 1)} />
                </div>
                <div className={styles.controlRow}>
                    <div className={styles.maskTwoTitles}>Z: </div>
                    <ToggleSwitch checked={Z} onChange={(value) => this.handleSwitch(value, 2)} />
                </div>
            </div>
        );
    }
}

export default BitShiftInput;
