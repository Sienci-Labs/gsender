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

import React from 'react';
import classnames from 'classnames';
import ToggleSwitch from 'react-switch';
import PropTypes from 'prop-types';

import styles from './index.styl';

const Switch = ({ label, checked, onChange, className, style, disabled }) => {
    return (
        <div className={classnames(styles['toggle-item'], className)} style={style}>
            {label && <span>{label}</span> }
            <ToggleSwitch
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                checkedIcon={false}
                uncheckedIcon={false}
                onColor="#295d8d"
                height={24}
                width={48}
            />
        </div>
    );
};

Switch.propTypes = {
    label: PropTypes.string,
    checked: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

Switch.defaultProps = {
    disabled: false,
};

export default Switch;
