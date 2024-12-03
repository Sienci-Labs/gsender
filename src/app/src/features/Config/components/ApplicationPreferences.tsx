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

export function ApplicationPreferences() {
    const inputRef = useRef();
    return (
        <fieldset className="flex flex-row gap-x-6 mr-4 border border-gray-200 px-4 py-2">
            <legend className="text-slate-600">gSender Preferences</legend>
            <IconFunctionButton
                label="Export"
                icon={<FiUpload />}
                onClick={exportSettings}
            />
            <IconFunctionButton
                label="Import"
                icon={<FiDownload />}
                onClick={() => {
                    inputRef.current.click();
                }}
            />
            <IconFunctionButton
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
