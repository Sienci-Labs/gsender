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

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './index.styl';

const DigitalReadout = (props) => {
    const { label, value, children } = props;

    return (
        <div className={classNames('row', 'no-gutters', styles.dro)}>
            <div className="col col-xs-1">
                <div className={styles.droLabel}>{label}</div>
            </div>
            <div className="col col-xs-2">
                <div
                    className={classNames(
                        styles.well,
                        styles.droDisplay
                    )}
                >
                    {value}
                </div>
            </div>
            <div className="col col-xs-9">
                <div className={styles.droBtnGroup}>
                    <div className="input-group input-group-sm">
                        <div className="input-group-btn">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

DigitalReadout.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string
};

export default DigitalReadout;
