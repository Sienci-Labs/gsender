import React, { useRef } from 'react';
import { IconFunctionButton } from 'app/features/Config/components/IconFunctionButton.tsx';
import { FiUpload } from 'react-icons/fi';
import { FiDownload } from 'react-icons/fi';
import { GrPowerReset } from 'react-icons/gr';
import {
    exportSettings,
    handleRestoreDefaultClick,
    importSettings,
} from 'app/features/Config/utils/Settings.ts';
import { ActionButton } from 'app/features/Config/components/ActionButton.tsx';

export function ApplicationPreferences() {
    const inputRef = useRef();
    return (
        <fieldset className="flex flex-row gap-x-6 mr-4 border border-gray-200 px-4 py-2 dark:border-gray-700 dark:text-white">
            <legend className="text-slate-600 dark:text-white">
                gSender Preferences
            </legend>
            <ActionButton
                label="Export"
                icon={<FiUpload />}
                onClick={exportSettings}
            />
            <ActionButton
                label="Import"
                icon={<FiDownload />}
                onClick={() => {
                    inputRef.current.click();
                }}
            />
            <ActionButton
                label="Reset"
                icon={<GrPowerReset />}
                onClick={handleRestoreDefaultClick}
            />
            <input
                type="file"
                onChange={importSettings}
                onClick={(e) => {
                    e.target.value = null;
                }}
                accept=".json"
                className="hidden"
                ref={inputRef}
            />
        </fieldset>
    );
}
