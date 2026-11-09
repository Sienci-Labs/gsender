import { useAppTranslation } from 'app/i18n';
import { TiWarning } from 'react-icons/ti';

export function MenuWarning() {
    const { t } = useAppTranslation();
    return (
        <div
            className="bg-yellow-100 border-t border-b border-yellow-500 text-yellow-700 px-4 py-3"
            role="alert"
        >
            <p className="font-bold flex flex-row items-center gap-2 justify-center">
                <span>
                    <TiWarning />
                </span>
                {t('config:page.disconnected')}
            </p>
            <p className="text-sm text-center">
                {t('config:page.disconnectedMessage')}
            </p>
        </div>
    );
}
