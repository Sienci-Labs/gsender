import { useAppTranslation } from 'app/i18n';
export function EmptySectionWarning() {
    const { t } = useAppTranslation();
    return (
        <div className="flex flex-col gap-4 w-full items-center justify-center my-2">
            <p className="text-gray-600 text-sm bg-gray-100">
                {t('config:page.emptySection')}
            </p>
        </div>
    );
}
