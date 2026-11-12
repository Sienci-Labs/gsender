import { useAppTranslation } from 'app/i18n';

export const PrimaryArea = () => {
    const { t } = useAppTranslation();
    return (
        <div className="border p-3 flex-1">
            {t('workspace:layout.visualizerPlaceholder')}
        </div>
    );
};
