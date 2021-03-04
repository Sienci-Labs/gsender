import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Dropdown, { MenuItem } from 'app/components/Dropdown';

import styles from './index.styl';

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
    }

    state = {
        display: 'name',
    }

    /**
     * Function to handle mouse enter on the wrapper div
     */
    handleMouseEnter = () => {
        this.setState({ display: 'icon' });
    }

    /**
     * Function to handle mouse leave on the wrapper div
     */
    handleMouseLeave = () => {
        this.setState({ display: 'name' });
    }

    render() {
        const { macro, onRun, onEdit, onDelete } = this.props;
        const { display } = this.state;

        return (
            <div
                className={styles['macro-item']}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
            >
                <div
                    onClick={onRun(macro)}
                    onKeyDown={onRun(macro)}
                    role="button"
                    tabIndex={-1}
                    className={styles['macro-item-control']}
                >
                    { display === 'name' && <div>{macro.name}</div>}

                    { display === 'icon' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            Run {`"${macro.name}"`}{' '}
                            <i
                                className="fa fa-play"
                                style={{ fontSize: '1.25rem', color: '#059669', outline: 'none' }}
                            />
                        </div>
                    )}
                </div>


                <Dropdown style={{ width: '15%', height: '100%' }} pullRight>
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
                </Dropdown>
            </div>
        );
    }
}
