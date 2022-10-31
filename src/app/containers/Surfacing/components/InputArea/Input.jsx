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

import ShowTooltip from '../ShowTooltip';
import { InputLabelStyled, InputStyled, InputWrapperStyled } from './styled';

const Input = ({ value, label, units, onChange, additionalProps, className, style, tooltip }) => {
    return (
        <ShowTooltip tooltip={tooltip}>
            <InputWrapperStyled hasTwoColumns={!!label}>
                {label && <InputLabelStyled htmlFor="">{label}</InputLabelStyled>}
                <div className="input-group">
                    <InputStyled
                        {...additionalProps}
                        value={value}
                        externalOnChange={onChange}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.target.select()}
                        type="number"
                        className={classNames('form-control')}
                    />
                    {units && <span className="input-group-addon">{units}</span>}
                </div>
            </InputWrapperStyled>
        </ShowTooltip>
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
    tooltip: PropTypes.object
};

Input.defaultProps = {
    additionalProps: { type: 'text' },
};

export default Input;
