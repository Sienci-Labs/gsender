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
import { GRBL_ACTIVE_STATE_JOG, GRBL_ACTIVE_STATE_RUN } from 'app/constants';
import styles from '../index.styl';

const JogCancel = ({ activeState, ...props }) => {
    return (
        <button
            {...props}
            className={cx(styles.jogCancelButton, { [styles.jogActive]: (activeState === GRBL_ACTIVE_STATE_RUN || activeState === GRBL_ACTIVE_STATE_JOG) })}
            title="Cancel movement"
        >
            <i className="fas fa-ban" />
        </button>
    );
};

export default JogCancel;
