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

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './input.styl';

const Input = ({ value, label, units, onChange, additionalProps, className, style, disabled }) => {
    return (
        <div className={classNames(styles.input, 'form-group', className)} style={style}>
            {label && <label htmlFor="">{`${label}`}</label>}
            <div className="input-group">
                <input
                    {...additionalProps}
                    value={value}
                    onChange={onChange}
                    className={classNames('form-control', styles.inputText)}
                    disabled={disabled}
                    type="number"
                />
                {units && <span className="input-group-addon">{units}</span>}
            </div>
        </div>
    );
};

Input.propTypes = {
    label: PropTypes.string,
    units: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    additionalProps: PropTypes.object,
    className: PropTypes.string,
    style: PropTypes.object,
    disabled: PropTypes.bool,
};

Input.defaultProps = {
    additionalProps: { type: 'text' },
};

export default Input;
