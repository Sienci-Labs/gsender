import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { useWizardAPI } from 'app/features/Helper/context';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';

const CancelButton = () => {
    const { cancelToolchange } = useWizardAPI();

    const handleCancel = () => {
        Confirm({
            title: 'Cancel Toolchange Wizard',
            content:
                'Are you sure you want to cancel the toolchange wizard? All steps will be lost.',
            confirmLabel: 'Yes',
            onConfirm: () => {
                cancelToolchange();
            },
        });
    };

    return (
        <button
            type="button"
            className="border-none outline-none bg-gray-200"
            onClick={handleCancel}
        >
            <FaTimes />
        </button>
    );
};

export default CancelButton;
