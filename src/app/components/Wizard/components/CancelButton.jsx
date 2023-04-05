import React from 'react';

import { useWizardAPI } from 'app/components/Wizard/context';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

import styles from '../index.styl';

const CancelButton = () => {
    const { cancelToolchange } = useWizardAPI();

    const handleCancel = () => {
        Confirm({
            title: 'Cancel Toolchange Wizard',
            content: 'Are you sure you want to cancel the toolchange wizard? All steps will be lost.',
            confirmLabel: 'Yes',
            onConfirm: () => {
                cancelToolchange();
            }
        });
    };

    return (
        <button type="button" className={styles.actionButton} onClick={handleCancel}>
            <i className="fas fa-times" />
        </button>
    );
};

export default CancelButton;
