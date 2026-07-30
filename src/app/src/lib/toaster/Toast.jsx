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
import cx from 'classnames';
import styles from './toaster.styl';
import {
    TOASTER_DANGER,
    TOASTER_INFO,
    TOASTER_SUCCESS,
    /*TOASTER_UNTIL_CLOSE,*/ TOASTER_WARNING,
} from './ToasterLib';
//import ToastTimer from './ToastTimer';

const Toast = ({
    id,
    msg = 'NO_MSG_SPECIFIED',
    type = TOASTER_INFO,
    closeHandler,
    icon = 'fa-info-circle',
    duration,
    createdAt,
    ...rest
}) => {
    //const hasDuration = duration !== TOASTER_UNTIL_CLOSE;

    return (
        <div
            id={id}
            className={styles.toastWrapper}
            tabIndex="0"
            role="button"
            onClick={closeHandler}
            onKeyDown={closeHandler}
        >
            <div
                className={cx(
                    styles.toastIcon,
                    { [styles.toastInfo]: type === TOASTER_INFO },
                    { [styles.toastSuccess]: type === TOASTER_SUCCESS },
                    { [styles.toastDanger]: type === TOASTER_DANGER },
                    { [styles.toastWarning]: type === TOASTER_WARNING },
                )}
            >
                <i className={`fas ${icon}`} />
            </div>
            <div className={styles.toastContent}>{msg}</div>
            <div className={styles.toastClose}>
                <button type="button" onClick={closeHandler}>
                    <i className="fas fa-times" />
                </button>
            </div>
            {/*hasDuration &&
                // eslint-disable-next-line react/style-prop-object
                <ToastTimer duration={duration} createdAt={createdAt} />*/}
        </div>
    );
};

export default Toast;
