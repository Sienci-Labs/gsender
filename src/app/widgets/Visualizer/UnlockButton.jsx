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

import React, { useState } from 'react';
import styles from './UnlockButton.styl';


const UnlockButton = () => {
    const [isHovering, setIsHovering] = useState(false);
    const onMouseOver = () => {
        setIsHovering(true);
    };
    const onMouseOut = () => {
        setIsHovering(false);
    };
    return (
        <div className={styles.unlockButton} onMouseOver={onMouseOver} onMouseLeave={onMouseOut}>
            <div className={styles.unlockIndicator}>
                <i className="fas fa-caret-right" />
            </div>
            <i className={isHovering ? 'fas fa-lock-open' : 'fas fa-unlock fa-flip-horizontal'} />
            {
                isHovering &&
                <div className={styles.unlockText}>
                    Unlock Machine
                </div>
            }
        </div>
    );
};

export default UnlockButton;
