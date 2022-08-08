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

    state = {
        isChecked: false,
        toggleStatus: 'jobStatus',
    }

    handleOverrideToggle = () => {
        if (this.state.toggleStatus === 'jobStatus') {
            this.setState({
                isChecked: true,
                toggleStatus: 'overrides',
            });
        } else {
            this.setState({
                isChecked: false,
                toggleStatus: 'jobStatus',
            });
        }
    }

    componentDidUpdate() {
        if (!this.props.fileLoaded || !this.props.connection.isConnected) {
            this.setState({ isChecked: false,
                toggleStatus: 'jobStatus', });
        }
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
                                            <span className={styles['file-text']}>{name}</span>{' '}<span>({this.fileSizeFormat(size)}, {total} lines)</span>
                                            <span style={{ marginLeft: '2rem' }} />
                                        </TooltipCustom>
                                        {connection.isConnected
                                            ? (
                                                <ToggleSwitch
                                                    label="Overrides"
                                                    onChange={() => this.handleOverrideToggle()}
                                                    className={styles.litetoggle}
                                                    checked={this.state.isChecked}
                                                    size="md"
                                                />
                                            ) : <span />
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
                {this.state.isChecked
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
    return {
        ...file,
        filteredPath,
        connection
    };
})(JobStatus);
