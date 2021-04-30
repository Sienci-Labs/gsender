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

import React, { Component } from 'react';
import Dropdown from 'rc-dropdown';
import PropTypes from 'prop-types';
import 'rc-dropdown/assets/index.css';

import styles from './index.styl';
import { Toaster, TOASTER_INFO } from '../../lib/toaster/ToasterLib';

/**
 * Toggle Component used to trigger the dropdown
 * @prop {Object} props Various props passed by the parent Dropdown component
 */
const Toggle = (props) => {
    return (
        <div {...props} className={styles['macro-item-options']}>
            <i className="fas fa-ellipsis-h" />
        </div>
    );
};

/**
 * Macro Item Component
 * @prop {Object} macro Macro object
 * @prop {Array} onRun Function to run the macro
 * @prop {Function} onEdit Function to edit the macro
 * @prop {Function} onDelete Function to delete the macro
 */
export default class MacroItem extends Component {
    static propTypes = {
        macro: PropTypes.object,
        onRun: PropTypes.func,
        onEdit: PropTypes.func,
        onDelete: PropTypes.func,
        disabled: PropTypes.bool,
    }

    state = {
        display: 'name',
    }

    /**
     * Function to handle mouse enter on the wrapper div
     */
    handleMouseEnter = () => {
        if (this.state.display !== 'running') {
            this.setState({ display: 'icon' });
        }
    }

    /**
     * Function to handle mouse leave on the wrapper div
     */
    handleMouseLeave = () => {
        if (this.state.display !== 'running') {
            this.setState({ display: 'name' });
        }
    }

    onMacroRun = () => {
        const { macro, onRun, disabled } = this.props;

        if (disabled) {
            return;
        }

        onRun(macro);
        Toaster.pop({
            msg: `Started running macro '${macro.name}'!`,
            type: TOASTER_INFO
        });
        this.setState({ display: 'running' });

        setTimeout(() => {
            this.setState({ display: 'name' });
        }, 4000);
    }

    render() {
        const { macro, onEdit, onDelete, disabled } = this.props;
        const { display } = this.state;

        const Menu = (
            <div className={styles.dropdown}>
                <div
                    className={styles['macro-menu-item']}
                    style={{ marginBottom: '5px' }}
                    onClick={onEdit(macro)}
                    onKeyDown={onEdit(macro)}
                    tabIndex={-1}
                    role="button"
                >
                    <i className="fas fa-edit" style={{ color: '#3e85c7' }} /><span>Edit</span>
                </div>

                <div
                    className={styles['macro-menu-item']}
                    onClick={onDelete(macro.id)}
                    onKeyDown={onDelete(macro.id)}
                    tabIndex={-1}
                    role="button"
                >
                    <i className="fas fa-trash-alt" style={{ color: '#dc2626' }} /> <span>Delete</span>
                </div>
            </div>
        );

        return (
            <div
                className={styles['macro-item']}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
            >
                <div
                    onClick={this.onMacroRun}
                    onKeyDown={this.onMacroRun}
                    role="button"
                    tabIndex={-1}
                    className={styles[disabled ? 'macro-item-control-disabled' : 'macro-item-control']}
                >
                    {
                        disabled
                            ? <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> {macro.name} </div>
                            : (
                                <>
                                    { display === 'name' && (
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> {macro.name} </div>)
                                    }

                                    { display === 'running' && <div className={styles['glowing-background']}>Running...</div>}

                                    { display === 'icon' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <i
                                                className="fa fa-play"
                                                style={{ fontSize: '1rem', color: '#059669', outline: 'none' }}
                                            />
                                            Run {`${macro.name}`}{' '}
                                        </div>
                                    )}
                                </>
                            )
                    }
                </div>

                <Dropdown
                    trigger={['click']}
                    overlay={Menu}
                    animation="slide-up"
                >
                    <Toggle />
                </Dropdown>


                {/* <Dropdown style={{ width: '15%', height: '100%' }} pullRight>
                    <Dropdown.Toggle componentClass={Toggle} />

                    <Dropdown.Menu>
                        <MenuItem onClick={onEdit(macro)}>
                            <div className={styles['macro-menu-item']}>
                                <i className="fas fa-edit" style={{ color: '#3e85c7' }} /><span>Edit</span>
                            </div>
                        </MenuItem>
                        <MenuItem onClick={onDelete(macro.id)}>
                            <div className={styles['macro-menu-item']}>
                                <i className="fas fa-trash-alt" style={{ color: '#dc2626' }} /> <span>Delete</span>
                            </div>
                        </MenuItem>
                    </Dropdown.Menu>
                </Dropdown> */}
            </div>
        );
    }
}
