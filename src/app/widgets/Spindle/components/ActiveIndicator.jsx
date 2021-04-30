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
import cx from 'classnames';
import styles from '../index.styl';

const ActiveIndicator = ({ canClick, active = true }) => {
    const showIndicator = canClick && active;

    return (
        <div className={styles.activeIndicatorWrapper}>
            <small>
                {
                    showIndicator ? 'Active' : 'Not Active'
                }
            </small>
            <div className={cx(styles.activeIndicator, { [styles.activeIndicatorOn]: showIndicator })}>
                {
                    showIndicator && <i className={cx('fas fa-exclamation', styles.activePulse)} />
                }
            </div>
        </div>

    );
};

export default ActiveIndicator;
