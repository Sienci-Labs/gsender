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

/* eslint-disable no-restricted-globals */
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import get from 'lodash/get';
import pubsub from 'pubsub-js';
import reduxStore from 'app/store/redux';
import combokeys from 'app/lib/combokeys';
import controller from 'app/lib/controller';
import log from 'app/lib/log';
import { UPDATE_JOB_OVERRIDES } from 'app/actions/visualizerActions';
import { connect } from 'react-redux';
import TooltipCustom from 'app/components/TooltipCustom/ToolTip';
import ToggleSwitch from 'app/components/ToggleSwitch';
import { OVERRIDES_CATEGORY, OVERRIDE_VALUE_RANGES } from '../../constants';
import IdleInfo from './components/IdleInfo';
import Overrides from './components/Overrides';
import styles from './index.styl';
import useKeybinding from '../../lib/useKeybinding';


// TODO: This component needs an overhaul

/**
 * Job Status component wrapper
 * @param {Object} state Default state given from parent component (main index.js for this widget)
 */
class JobStatus extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
    };

    shuttleControlFunctions = {
        FEEDRATE_OVERRIDE: (_, { amount }) => {
            const { fileLoaded, connection, ovF } = this.props;
            const feedRate = ovF + (Number(amount) || 0);

            if (fileLoaded && connection.isConnected) {
                if (get(reduxStore.getState(), 'visualizer.jobOverrides.toggleStatus') === 'jobStatus') {
                    this.handleOverrideToggle();
                }
                if (feedRate <= OVERRIDE_VALUE_RANGES.MAX && feedRate >= OVERRIDE_VALUE_RANGES.MIN) {
                    switch (Number(amount)) {
                    case 1:
                        controller.write('\x93');
                        break;
                    case -1:
                        controller.write('\x94');
                        break;
                    case 10:
                        controller.write('\x91');
                        break;
                    case -10:
                        controller.write('\x92');
                        break;
                    case 0:
                        controller.write('\x90');
                        break;
                    default:
                        break;
                    }
                    pubsub.publish('feedrate:change', feedRate);
                } else {
                    log.error('ovF out of range: ' + this.props.ovF);
                }
            }
        },
        SPINDLE_OVERRIDE: (_, { amount }) => {
            const { fileLoaded, connection, ovS } = this.props;
            const spindleSpeed = ovS + (Number(amount) || 0);

            if (fileLoaded && connection.isConnected) {
                if (get(reduxStore.getState(), 'visualizer.jobOverrides.toggleStatus') === 'jobStatus') {
                    this.handleOverrideToggle();
                }
                if (spindleSpeed <= OVERRIDE_VALUE_RANGES.MAX && spindleSpeed >= OVERRIDE_VALUE_RANGES.MIN) {
                    switch (Number(amount)) {
                    case 1:
                        controller.write('\x9C');
                        break;
                    case -1:
                        controller.write('\x9D');
                        break;
                    case 10:
                        controller.write('\x9A');
                        break;
                    case -10:
                        controller.write('\x9B');
                        break;
                    case 0:
                        controller.write('\x99');
                        break;
                    default:
                        break;
                    }
                    pubsub.publish('spindlespeed:change', spindleSpeed);
                } else {
                    log.error('ovS out of range: ' + this.props.ovS);
                }
            }
        },
    }

    shuttleControlEvents = {
        FEEDRATE_OVERRIDE_P: {
            title: 'Feed +',
            keys: '',
            gamepadKeys: '5',
            keysName: 'R1',
            cmd: 'FEEDRATE_OVERRIDE_P',
            payload: { amount: 1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        FEEDRATE_OVERRIDE_PP: {
            title: 'Feed ++',
            keys: '',
            gamepadKeys: '',
            keysName: 'Feed ++',
            cmd: 'FEEDRATE_OVERRIDE_PP',
            payload: { amount: 10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        FEEDRATE_OVERRIDE_M: {
            title: 'Feed -',
            keys: '',
            gamepadKeys: '7',
            keysName: 'R2',
            cmd: 'FEEDRATE_OVERRIDE_M',
            payload: { amount: -1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        FEEDRATE_OVERRIDE_MM: {
            title: 'Feed --',
            keys: '',
            gamepadKeys: '',
            keysName: 'Feed --',
            cmd: 'FEEDRATE_OVERRIDE_MM',
            payload: { amount: -10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        FEEDRATE_OVERRIDE_RESET: {
            title: 'Feed Reset',
            keys: '',
            gamepadKeys: '',
            keysName: 'Feed Reset',
            cmd: 'FEEDRATE_OVERRIDE_RESET',
            payload: { amount: 0 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.FEEDRATE_OVERRIDE,
        },
        SPINDLE_OVERRIDE_P: {
            title: 'Spindle/Laser +',
            keys: '',
            gamepadKeys: '4',
            keysName: 'L1',
            cmd: 'SPINDLE_OVERRIDE_P',
            payload: { amount: 1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE
        },
        SPINDLE_OVERRIDE_PP: {
            title: 'Spindle/Laser ++',
            keys: '',
            gamepadKeys: '',
            keysName: 'Spindle/Laser ++',
            cmd: 'SPINDLE_OVERRIDE_PP',
            payload: { amount: 10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE
        },
        SPINDLE_OVERRIDE_M: {
            title: 'Spindle/Laser -',
            keys: '',
            gamepadKeys: '6',
            keysName: 'L2',
            cmd: 'SPINDLE_OVERRIDE_M',
            payload: { amount: -1 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE
        },
        SPINDLE_OVERRIDE_MM: {
            title: 'Spindle/Laser --',
            keys: '',
            gamepadKeys: '',
            keysName: 'Spindle/Laser --',
            cmd: 'SPINDLE_OVERRIDE_MM',
            payload: { amount: -10 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE
        },
        SPINDLE_OVERRIDE_RESET: {
            title: 'Spindle/Laser Reset',
            keys: '',
            gamepadKeys: '',
            keysName: 'Spindle/Laser Reset',
            cmd: 'SPINDLE_OVERRIDE_RESET',
            payload: { amount: 0 },
            preventDefault: true,
            isActive: true,
            category: OVERRIDES_CATEGORY,
            callback: this.shuttleControlFunctions.SPINDLE_OVERRIDE
        },
    }

    /**
     * Determine the file size format between bytes, kilobytes (KB) and megabytes (MB)
     */
    fileSizeFormat = (size) => {
        const ONE_KB = 1000;
        const ONE_MB = 1000000;

        if (size >= ONE_KB && size < ONE_MB) {
            return `${(size / ONE_KB).toFixed(0)} KB`;
        } else if (size >= ONE_MB) {
            return `${(size / ONE_MB).toFixed(1)} MB`;
        }

        return `${size} bytes`;
    };

    handleOverrideToggle = () => {
        if (get(reduxStore.getState(), 'visualizer.jobOverrides.toggleStatus') === 'jobStatus') {
            localStorage.setItem('jobOverrideToggle', JSON.stringify({
                isChecked: true,
                toggleStatus: 'overrides',
            }));
        } else {
            localStorage.setItem('jobOverrideToggle', JSON.stringify({
                isChecked: false,
                toggleStatus: 'jobStatus',
            }));
        }
        reduxStore.dispatch({ type: UPDATE_JOB_OVERRIDES, payload: JSON.parse(localStorage.getItem('jobOverrideToggle')) });
    }

    addShuttleControlEvents() {
        combokeys.reload();

        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = eventName === 'MACRO' ? this.shuttleControlEvents[eventName] : this.shuttleControlEvents[eventName].callback;
            combokeys.on(eventName, callback);
        });
    }

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = eventName === 'MACRO' ? this.shuttleControlEvents[eventName] : this.shuttleControlEvents[eventName].callback;
            combokeys.removeListener(eventName, callback);
        });
    }

    componentDidUpdate() {
        if (!this.props.fileLoaded || !this.props.connection.isConnected) {
            localStorage.setItem('jobOverrideToggle', JSON.stringify({ isChecked: false,
                toggleStatus: 'jobStatus', }));
        }
    }

    componentDidMount() {
        localStorage.setItem('jobOverrideToggle', JSON.stringify({
            isChecked: false,
            toggleStatus: 'jobStatus',
        }));
        this.addShuttleControlEvents();
        useKeybinding(this.shuttleControlEvents);
    }

    componentWillUnmount() {
        this.removeShuttleControlEvents();
    }

    render() {
        const { state, name, size, total, fileLoaded, path, filteredPath, connection } = this.props;

        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles['file-info']}>
                    {
                        fileLoaded
                            ? (
                                <>
                                    <div className={styles['file-name']}>
                                        <TooltipCustom content={`${name} (${this.fileSizeFormat(size)}, ${total} lines)`} style={{ wordWrap: 'break-word' }}>
                                            <span className={styles['file-text']}>{name}</span>{' '}<span style={{ marginRight: '2rem' }}>({this.fileSizeFormat(size)}, {total} lines)</span>
                                        </TooltipCustom>
                                        {connection.isConnected
                                            ? (
                                                <ToggleSwitch
                                                    label="Overrides"
                                                    onChange={() => this.handleOverrideToggle()}
                                                    className={styles.litetoggle}
                                                    checked={get(reduxStore.getState(), 'visualizer.jobOverrides.isChecked')}
                                                    size="md"
                                                    style={{ minWidth: '10rem' }}
                                                />
                                            ) : null
                                        }
                                    </div>

                                    {filteredPath && (
                                        <div className={styles['file-path']}>
                                            <TooltipCustom content={`File Path: ${path}`} style={{ wordWrap: 'break-word' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span>Path:</span> <span className={styles['file-text']}>{filteredPath}</span>
                                                </div>
                                            </TooltipCustom>
                                        </div>
                                    )}
                                </>
                            )
                            : (<div className={styles['file-name']}><span className={styles['file-text']}>No File Loaded</span></div>)}
                </div>
                {get(reduxStore.getState(), 'visualizer.jobOverrides.isChecked') && state.senderStatus && fileLoaded
                    ? <Overrides state={state} />
                    : <IdleInfo state={state} />
                }
            </div>
        );
    }
}

export default connect((store) => {
    const file = get(store, 'file', {});
    const path = get(file, 'path', '');
    const name = get(file, 'name', '');
    const filteredPath = path.replace(name, '');
    const connection = get(store, 'connection');
    const activeState = get(store, 'controller.state.status.activeState', 'Idle');
    const overrides = get(store, 'controller.state.status.ov', [0, 0, 0]);

    const ovF = overrides[0];
    const ovS = overrides[2];

    return {
        ...file,
        filteredPath,
        connection,
        activeState,
        ovF,
        ovS,
    };
})(JobStatus);
