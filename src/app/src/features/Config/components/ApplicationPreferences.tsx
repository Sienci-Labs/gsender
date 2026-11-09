import { ActionButton } from 'app/features/Config/components/ActionButton.tsx';
import {
    exportSettings,
    handleRestoreDefaultClick,
    importSettings,
} from 'app/features/Config/utils/Settings.ts';
import { useAppTranslation } from 'app/i18n';
import { useRef } from 'react';
import { GrPowerReset } from 'react-icons/gr';
import { PiDownloadSimple, PiUploadSimple } from 'react-icons/pi';

export function ApplicationPreferences() {
    const { t } = useAppTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <fieldset className="max-sm:hidden flex flex-row gap-x-2 mr-4 mb-1 border rounded border-gray-200 px-4 pb-2 dark:border-outline dark:text-content-primary">
            <legend className="text-slate-600 dark:text-content-primary">
                {t('config:preferences.legend')}
            </legend>
            <div className="-mx-4 grid grid-cols-3 divide-x">
                <ActionButton
                    label={t('common:actions.reset')}
                    icon={<GrPowerReset />}
                    onClick={handleRestoreDefaultClick}
                    testId="gsender-settings-reset-button"
                />
                <ActionButton
                    label={t('config:preferences.import')}
                    icon={<PiDownloadSimple />}
                    onClick={() => {
                        inputRef.current.click();
                    }}
                    testId="gsender-settings-import-button"
                />
                <ActionButton
                    label={t('config:preferences.export')}
                    icon={<PiUploadSimple />}
                    onClick={exportSettings}
                    testId="gsender-settings-export-button"
                />
                <input
                    type="file"
                    onChange={importSettings}
                    onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                    }}
                    accept=".json"
                    className="hidden"
                    ref={inputRef}
                />
            </div>
        </fieldset>
    );
}
