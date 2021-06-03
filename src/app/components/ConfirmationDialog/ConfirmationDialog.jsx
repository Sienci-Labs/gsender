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

import React, { useState, useEffect } from 'react';
import pubsub from 'pubsub-js';
import cx from 'classnames';
import styles from './index.styl';
import ConfirmationDialogButton from './ConfirmationDialogButton';
import { DIALOG_CONFIRM, DIALOG_CANCEL } from './ConfirmationDialogLib';

const ConfirmationDialog = () => {
    const [show, setShow] = useState(false);
    const [title, setTitle] = useState(null);
    //const [buttons, setButtons] = useState([]);
    const [content, setContent] = useState(null);
    const [onClose, setOnClose] = useState(null);
    const [onConfirm, setOnConfirm] = useState(null);
    const [confirmLabel, setConfirmLabel] = useState(null);
    const [cancelLabel, setCancelLabel] = useState(null);

    let hideModal = !show;

    useEffect(() => {
        hideModal = !show;
    }, [show]);

    useEffect(() => {
        pubsub.subscribe('dialog:new', (event, options) => {
            setTitle(options.title);
            //setButtons(options.buttons);
            setContent(options.content);
            setOnClose(() => options.onClose);
            setOnConfirm(() => options.onConfirm);
            setConfirmLabel(options.confirmLabel);
            setCancelLabel(options.cancelLabel);
            setShow(true);
        });
    });

    return (
        <div className={cx(styles.confirmationDialogWrapper, { [styles.hidden]: hideModal })}>
            <div className={styles.confirmationDialog}>
                <div className={styles.confirmationBar} />
                <div className={styles.confirmationDialogTitle}>
                    <i className="fas fa-exclamation-triangle" />
                    <span>{ title }</span>
                </div>
                <div className={styles.confirmationDialogContent}>
                    { content }
                </div>
                <div className={styles.confirmationDialogButtons}>
                    <ConfirmationDialogButton
                        onClick={() => {
                            if (onClose !== null) {
                                onClose();
                            }
                            return setShow(false);
                        }}
                        variant={DIALOG_CANCEL}
                    >
                        { cancelLabel }
                    </ConfirmationDialogButton>
                    <ConfirmationDialogButton
                        onClick={() => {
                            if (onConfirm !== null) {
                                onConfirm();
                            }
                            return setShow(false);
                        }}
                        variant={DIALOG_CONFIRM}
                    >
                        { confirmLabel }
                    </ConfirmationDialogButton>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
