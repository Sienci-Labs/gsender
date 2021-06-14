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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import controller from 'app/lib/controller';
import AlarmDescriptionIcon from 'app/widgets/Visualizer/AlarmDescriptionIcon';
import styles from './machine-status-area.styl';
import UnlockAlarmButton from './UnlockAlarmButton';
import { GRBL_ACTIVE_STATE_HOME } from '../../constants';


/**
 * Control Area component displaying machine status
 * @param {Object} state Default state given from parent component
 * @param {Object} actions Actions object given from parent component
 */
export default class ControlArea extends Component {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
    }

    state = {
        currentAlarmIcon: 'fa-lock'
    }

    unlock = () => {
        controller.command('unlock');
    }

    handleHomeMachine = () => {
        controller.command('unlock');
        controller.command('homing');
    }

    render() {
        const { controller, port, layoutIsReversed } = this.props.state;
        const { state = {} } = controller;

        //Object to customize the message of the active machine state
        const message = {
            Idle: 'Idle',
            Run: 'Running',
            Hold: 'Hold',
            Jog: 'Jogging',
            Check: 'Check',
            Home: 'Homing',
            Sleep: 'Sleep',
            Alarm: 'Alarm',
            Disconnected: 'Disconnected',
        };

        /**
         * Function to output the machine state based on multiple conditions
         */
        const machineStateRender = () => {
            if (port) {
                if (controller?.state?.status) {
                    let alarmCode = controller.state.status.alarmCode;
                    let homingEnabled = controller.settings.settings.$22;
                    if (alarmCode === 'Homing' && homingEnabled === '1') {
                        return (
                            <div className={styles['machine-status-wrapper']}>
                                <div className={styles[`machine${state.status.activeState}`]}>
                                    {
                                        state.status.activeState === GRBL_ACTIVE_STATE_HOME ? 'Homing...' : 'Run Homing'
                                    }
                                </div>
                                <UnlockAlarmButton newMessage="Click To Home Machine" onClick={this.handleHomeMachine} />
                            </div>
                        );
                    }
                }
                if (state.status?.activeState === 'Alarm') {
                    return (
                        <div className={styles['machine-status-wrapper']}>
                            <div className={styles['machine-Alarm']}>
                                {state.status.activeState} ({state.status.alarmCode})<AlarmDescriptionIcon code={state.status.alarmCode} />
                            </div>
                            <UnlockAlarmButton onClick={this.unlock} />
                        </div>
                    );
                } else if (state.status?.activeState === 'Check') {
                    return (
                        <div className={styles['machine-status-wrapper']}>
                            <div className={styles['machine-Jog']}>
                             Checking Gcode File...
                            </div>
                        </div>
                    );
                } {
                    return state.status?.activeState //Show disconnected until machine connection process is finished, otherwise an empty div is shown
                        ? (
                            <div className={styles[`machine-${state.status.activeState}`]}>
                                { message[state.status.activeState] }
                            </div>
                        )
                        : <div className={styles['machine-Disconnected']}>Disconnected</div>;
                }
            } else {
                return <div className={styles['machine-Disconnected']}>Disconnected</div>;
            }
        };

        return (
            <div className={classnames(styles['control-area'], layoutIsReversed ? styles.inverted : '')}>
                <div />
                {machineStateRender()}
                <div />
            </div>
        );
    }
}
