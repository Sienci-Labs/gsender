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
import React from 'react';
import styles from '../index.styl';

import { PRIMARY_COLOR, SECONDARY_COLOR } from '../constants';

const PositionLabel = ({ value, small }) => {
    value = String(value);
    return (
        <div
            style={{ fontSize: small ? '14px' : '1.75rem',
                padding: '0px 5px',
                textAlign: 'center',
                color: small ? SECONDARY_COLOR : PRIMARY_COLOR,
                fontWeight: small ? '400' : 'bold' }}
            className={styles.axesPositionLabel}
        >
            <span>{value.split('.')[0]}</span>
            <span>.</span>
            <span>{value.split('.')[1]}</span>
        </div>
    );
};

PositionLabel.propTypes = {
    value: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    small: PropTypes.bool,
};

export default PositionLabel;
