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

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Button } from '../Buttons';
import Dropdown from '../Dropdown';
import styles from './index.styl';

class DropdownButton extends PureComponent {
    static propTypes = {
        ...Dropdown.propTypes,

        // One of: 'lg', 'md', 'sm', 'xs'
        btnSize: Button.propTypes.btnSize,

        // One of: 'default', 'primary', 'emphasis', 'flat', 'link'
        btnStyle: Button.propTypes.btnStyle,

        // toggle
        toggle: PropTypes.node.isRequired,

        // Align the menu to the right side of the dropdown toggle.
        pullRight: PropTypes.bool,

        // Whether to prevent a caret from being rendered next to the title.
        noCaret: PropTypes.bool
    };

    static defaultProps = {
        pullRight: true,
        noCaret: true
    };

    render() {
        const { btnSize, toggle, style, children, ...props } = this.props;

        // Split component props
        const dropdownProps = {};
        const toggleProps = {};
        Object.keys(props).forEach(propName => {
            const propValue = props[propName];
            if (Dropdown.ControlledComponent.propTypes[propName]) {
                dropdownProps[propName] = propValue;
            } else {
                toggleProps[propName] = propValue;
            }
        });

        return (
            <Dropdown
                {...dropdownProps}
                style={{
                    ...style,
                    float: 'left'
                }}
                btnSize={btnSize}
            >
                <Dropdown.Toggle
                    {...toggleProps}
                    className={styles.widgetButton}
                    componentClass="a"
                >
                    {toggle}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {children}
                </Dropdown.Menu>
            </Dropdown>
        );
    }
}

export default DropdownButton;
