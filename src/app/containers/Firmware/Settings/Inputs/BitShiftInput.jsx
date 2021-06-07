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
        if (index > 7) {
            index = 7;
        }
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
