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

/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';
import PropTypes from 'prop-types';
import styles from './index.styl';

const ToolModal = (props) => {
    ToolModal.propTypes = {
        onClose: PropTypes.string.isRequired,
        component: PropTypes.object.isRequired,
        title: PropTypes.string.isRequired,
        handleClose: PropTypes.func.isRequired
    };

    return (
        <div className={styles.toolModalOverlay}>
            <div className={styles.toolModal}>
                <div className={styles.buttonContainer}>
                    <button type="button" className="fas fa-times" onClick={props.handleClose} />
                </div>
                <div>
                    <h3 className={styles.toolHeader}>{props.title}</h3>
                    <div className={styles.toolContainer}>
                        {props.component}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolModal;
