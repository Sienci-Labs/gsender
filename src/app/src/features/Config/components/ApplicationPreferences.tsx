import React, { useRef } from 'react';
import { IconFunctionButton } from 'app/features/Config/components/IconFunctionButton.tsx';
import { PiDownloadSimple, PiUploadSimple } from 'react-icons/pi';
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
        <fieldset className="flex flex-row gap-x-2 mr-4 mb-1 border rounded border-gray-200 px-4 pb-2 dark:border-gray-700 dark:text-white">
            <legend className="text-slate-600 dark:text-white">
                gSender Preferences
            </legend>
            <div className="-mx-4 grid grid-cols-3 divide-x">
                <ActionButton
                    label="Reset"
                    icon={<GrPowerReset />}
                    onClick={handleRestoreDefaultClick}
                />
                <ActionButton
                    label="Import"
                    icon={<PiDownloadSimple />}
                    onClick={() => {
                        inputRef.current.click();
                    }}
                />
                <ActionButton
                    label="Export"
                    icon={<PiUploadSimple />}
                    onClick={exportSettings}
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
            </div>
        </fieldset>
    );
}
