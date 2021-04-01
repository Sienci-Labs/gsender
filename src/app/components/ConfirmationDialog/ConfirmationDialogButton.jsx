import React from 'react';
import cx from 'classnames';
import styles from './index.styl';
import { DIALOG_CANCEL, DIALOG_CONFIRM } from './ConfirmationDialogLib';


const ConfirmationDialogButton = ({ children, onClick, variant = DIALOG_CONFIRM }) => {
    return (
        <button
            onClick={onClick}
            className={cx(styles.confirmationDialogButton,
                { [styles.confirmationDialogButtonConfirm]: variant === DIALOG_CONFIRM },
                { [styles.confirmationDialogButtonCancel]: variant === DIALOG_CANCEL })}
        >
            {children}
        </button>
    );
};

export default ConfirmationDialogButton;
