import { useAppTranslation } from 'app/i18n';
import { PiMaskHappyBold } from 'react-icons/pi';

export function EmptyAlarmList() {
    const { t } = useAppTranslation();
    return (
        <div className="w-full min-h-40 items-center justify-center flex flex-col gap-2">
            <span className="text-4xl text-gray-600 animate-attention dark:text-content-primary">
                <PiMaskHappyBold />
            </span>
            <p className="text-gray-600 dark:text-content-primary">
                {t('stats:alarms.empty')}
            </p>
        </div>
    );
}
