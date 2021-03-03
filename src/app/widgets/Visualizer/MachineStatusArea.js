import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import controller from 'app/lib/controller';

import styles from './machine-status-area.styl';

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

    render() {
        const { controller, port } = this.props.state;
        const { currentAlarmIcon } = this.state;

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
                if (state.status?.activeState === 'Alarm') {
                    return (
                        <div className={styles['machine-status-wrapper']}>
                            <div className={styles['machine-Alarm']}>
                                {state.status.activeState} ({state.status.alarmCode}){' '}
                            </div>

                            <i
                                onMouseEnter={() => this.setState({ currentAlarmIcon: 'fa-unlock' })}
                                onMouseLeave={() => this.setState({ currentAlarmIcon: 'fa-lock' })}
                                className={classnames('fas', currentAlarmIcon, styles['machine-status-unlock'])}
                                role="button"
                                tabIndex={-1}
                                onClick={this.unlock}
                                onKeyDown={this.unlock}
                            />

                            <div style={{ color: 'white', textAlign: 'center', fontSize: 'clamp(1rem, 1vw, 1.5rem)' }}>
                                <i className="fas fa-long-arrow-alt-up" style={{ fontSize: 'clamp(1.5rem, 2vw, 2.5rem)' }} />
                                <div>Click to Unlock Machine</div>
                            </div>
                        </div>
                    );
                } else {
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
            <div className={styles['control-area']}>
                <div />
                {machineStateRender()}
                <div />
            </div>
        );
    }
}
