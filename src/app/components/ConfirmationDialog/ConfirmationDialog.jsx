import React, { useState, useEffect } from 'react';
import pubsub from 'pubsub-js';
import cx from 'classnames';
import styles from './index.styl';
import ConfirmationDialogButton from './ConfirmationDialogButton';
import { DIALOG_CONFIRM, DIALOG_CANCEL } from './ConfirmationDialogLib';

const ConfirmationDialog = () => {
    const [show, setShow] = useState(false);
    const [title, setTitle] = useState(null);
    const [buttons, setButtons] = useState([]);
    const [content, setContent] = useState(null);
    const [onClose, setOnClose] = useState(null);
    const [onConfirm, setOnConfirm] = useState(null);
    const [confirmLabel, setConfirmLabel] = useState(null);
    const [cancelLabel, setCancelLabel] = useState(null);


    let hideModal = !show;

    const onCloseCB = () => {
        console.log(onClose);
        if (onClose) {
            onClose();
        }
        return setShow(false);
    };
    const onConfirmCB = () => {
        console.log(onConfirm);
        if (onConfirm) {
            onConfirm();
        }
        return setShow(false);
    };


    useEffect(() => {
        hideModal = !show;
    }, [show]);

    useEffect(() => {
        pubsub.subscribe('dialog:new', (event, options) => {
            setTitle(options.title);
            setButtons(options.buttons);
            setContent(options.content);
            setOnClose(options.onClose);
            setOnConfirm(options.onConfirm);
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
                    <ConfirmationDialogButton onClick={onCloseCB} variant={DIALOG_CANCEL}>{ cancelLabel }</ConfirmationDialogButton>
                    {
                        buttons.length > 0 && true
                    }
                    <ConfirmationDialogButton onClick={onConfirmCB} variant={DIALOG_CONFIRM}>{ confirmLabel }</ConfirmationDialogButton>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
