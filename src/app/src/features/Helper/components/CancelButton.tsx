import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib';
import { useWizardAPI } from 'app/features/Helper/context';
import { i18n, useAppTranslation } from 'app/i18n';
import { X } from 'lucide-react';
import React from 'react';

const CancelButton = () => {
    const { cancelToolchange } = useWizardAPI();
    const { t } = useAppTranslation();

    const handleCancel = () => {
        Confirm({
            title: i18n.t('helper:wizard.cancel.title'),
            content: i18n.t('helper:wizard.cancel.content'),
            confirmLabel: i18n.t('common:actions.yes'),
            onConfirm: () => {
                cancelToolchange();
            },
        });
    };

    return (
        <button
            type="button"
            onClick={handleCancel}
            aria-label={t('helper:wizard.cancel.label')}
            className="flex items-center justify-center w-7 h-7 rounded border border-gray-300 dark:border-outline bg-transparent text-gray-600 dark:text-content-muted hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
            <X size={12} />
        </button>
    );
};

export default CancelButton;
