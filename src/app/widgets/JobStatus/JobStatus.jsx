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
import reduxStore from 'app/store/redux';
import { UPDATE_JOB_OVERRIDES } from 'app/actions/visualizerActions';
import { connect } from 'react-redux';
import TooltipCustom from 'app/components/TooltipCustom/ToolTip';
import ToggleSwitch from 'app/components/ToggleSwitch';
import IdleInfo from './components/IdleInfo';
import Overrides from './components/Overrides';
import styles from './index.styl';

/**
 * Job Status component wrapper
 * @param {Object} state Default state given from parent component (main index.js for this widget)
 */
class JobStatus extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
    };

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
                {get(reduxStore.getState(), 'visualizer.jobOverrides.isChecked') && state.senderStatus
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
    return {
        ...file,
        filteredPath,
        connection,
        activeState
    };
})(JobStatus);
