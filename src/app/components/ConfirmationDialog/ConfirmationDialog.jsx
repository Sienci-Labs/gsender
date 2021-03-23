import React from 'react';
import styles from './index.styl';
import ConfirmationDialogButton from './ConfirmationDialogButton';
import { DIALOG_CONFIRM, DIALOG_CANCEL } from './ConfirmationDialogLib';

const ConfirmationDialog = ({
    title = 'Confirm',
    buttons = [],
    children = 'Are you sure you want to do this?',
    onClose = null,
    onConfirm = null
}) => {
    return (
        <div className={styles.confirmationDialogWrapper}>
            <div className={styles.confirmationDialog}>
                <div className={styles.confirmationDialogTitle}>
                    <div>{ title }</div>
                    <button>
                        <i className="fas fa-times" />
                    </button>
                </div>
                <div className={styles.confirmationDialogContent}>
                    { children }
                </div>
                <div className={styles.confirmationDialogButtons}>
                    {
                        buttons.length === 0 ?
                            <>
                                <ConfirmationDialogButton variant={DIALOG_CANCEL}>Cancel</ConfirmationDialogButton>
                                <ConfirmationDialogButton variant={DIALOG_CONFIRM}>Confirm</ConfirmationDialogButton>
                            </>
                            :
                            <>
                                <ConfirmationDialogButton />
                            </>
                    }
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
