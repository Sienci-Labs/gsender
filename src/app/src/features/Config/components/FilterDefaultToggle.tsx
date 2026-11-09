import { useAppTranslation } from 'app/i18n';
import { Switch } from 'app/components/shadcn/Switch';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';

export function FilterDefaultToggle() {
    const { t } = useAppTranslation();
    const { filterNonDefault, toggleFilterNonDefault } = useSettings();

    return (
        <div className="ml-8 flex flex-row gap-4 items-center max-xl:text-xs flex-grow max-sm:ml-0">
            <p className="text-gray-600 max-xl:hidden">
                {t('config:page.viewModified')}
            </p>
            <p className="text-gray-600 hidden max-xl:block">
                {t('config:page.modified')}
            </p>
            <Switch
                onChange={toggleFilterNonDefault}
                checked={filterNonDefault}
                aria-label={t('config:page.viewModifiedAria')}
            />
        </div>
    );
}
