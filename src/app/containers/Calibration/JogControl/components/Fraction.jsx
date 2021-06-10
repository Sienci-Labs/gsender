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

import PropTypes from 'prop-types';
import React from 'react';

const Fraction = (props) => {
    const { numerator, denominator } = props;

    return (
        <span
            style={{
                whiteSpace: 'nowrap',
                display: 'inline-block',
                verticalAlign: '-0.5em',
                fontSize: '85%',
                textAlign: 'center'
            }}
        >
            <span
                style={{
                    display: 'block',
                    lineHeight: '1em',
                    margin: '0 0.1em'
                }}
            >
                {numerator}
            </span>
            <span
                style={{
                    position: 'absolute',
                    left: -10000,
                    top: 'auto',
                    width: 1,
                    height: 1,
                    overflow: 'hidden'
                }}
            >
                /
            </span>
            <span
                style={{
                    borderTop: '1px solid',
                    display: 'block',
                    lineHeight: '1em',
                    margin: '0 0.1em',
                    minWidth: 16
                }}
            >
                {denominator}
            </span>
        </span>
    );
};

Fraction.propTypes = {
    numerator: PropTypes.number,
    denominator: PropTypes.number
};

export default Fraction;
