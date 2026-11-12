import { useAppTranslation } from 'app/i18n';

export function RestartHome() {
    const { t } = useAppTranslation();
    return (
        <div>
            <p>{t('common:wizard.restartHome')}</p>
        </div>
    );
}
