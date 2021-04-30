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

/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

/* eslint-disable brace-style */
/* eslint-disable indent */
/* eslint-disable react/jsx-closing-bracket-location */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ToggleSwitch from 'app/components/ToggleSwitch';
import styles from './index.styl';


class SwitchInput extends PureComponent {
    static propTypes = {
        switchSettings: PropTypes.object,
        title: PropTypes.string,
        currentSettings: PropTypes.object,
        getUsersNewSettings: PropTypes.func,
        grabNewSwitchInputSettings: PropTypes.func,
        disableSettingsButton: PropTypes.func
    }

    state = this.getInitialState();

    getInitialState() {
        return {
            defaultSettings: '',
            usersNewSettings: {},
            value: (this.props.currentSettings[this.props.title] === '1')
        };
    }


    componentDidMount = () => {
        this.getCurrentSettings();
    }

    getCurrentSettings = () => {
        let LoadedSettings = this.props.currentSettings;
        this.setState({ defaultSettings: LoadedSettings });
    }

    handleSingleToggleSettingsSwitches = (value) => {
        this.setState({
            value: value
        });
        if (value === true) {
            value = '1';
        }
        if (value === false) {
            value = '0';
        }

        this.props.disableSettingsButton();
        this.props.grabNewSwitchInputSettings(this.props.title, value);
    }


    render() {
        let title = this.props.title;
        let switchSettings = this.props.currentSettings;
        const { value } = this.state;
        //swaps 1 and 0s for true and false
        if (switchSettings[title] === '1') {
            switchSettings[title] = true;
        }
        if (switchSettings[title] === '0') {
            switchSettings[title] = false;
        }
        return (
            <div className={styles.switch}>
                <div className={styles.disable}>Disabled</div>
                <ToggleSwitch checked={value} onChange={this.handleSingleToggleSettingsSwitches} />
                <div className={styles.enable}>Enabled</div>
            </div>
        );
    }
}

export default SwitchInput;
