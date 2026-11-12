import type { ATCUnavailablePayload } from 'app/features/ATC/definitions';
import { translateKey, useAppTranslation } from 'app/i18n';

export function ATCUnavailable({
    payload,
}: {
    payload: ATCUnavailablePayload;
}) {
    const { t } = useAppTranslation();
    const { title, message, additionalInfo } = payload;

    return (
        <div
            className={
                'flex w-full h-full items-center justify-center gap-3 flex-col px-10 text-center'
            }
        >
            <div>
                <p className="text-gray-600 dark:text-content-muted text-sm">
                    {t('atc:unavailable.heading')}
                </p>
                <h1 className="text-xl font-bold dark:text-content-primary">
                    {translateKey(title)}
                </h1>
            </div>
            <p className="dark:text-content-secondary">
                {translateKey(message)}
            </p>

            {additionalInfo && (
                <p className="text-gray-600 dark:text-content-muted text-sm">
                    {translateKey(additionalInfo)}
                </p>
            )}
        </div>
    );
}
