import React from 'react';
import { IconFunctionButton } from 'app/features/Config/components/IconFunctionButton.tsx';
import { FiUpload } from 'react-icons/fi';
import { FiDownload } from 'react-icons/fi';
import { GrPowerReset } from 'react-icons/gr';

export function ApplicationPreferences() {
    return (
        <fieldset className="flex flex-row gap-x-6 mr-4 border border-gray-200 px-4 py-2">
            <legend className="text-slate-600">gSender Preferences</legend>
            <IconFunctionButton label="Export" icon={<FiUpload />} />
            <IconFunctionButton label="Import" icon={<FiDownload />} />
            <IconFunctionButton label="Reset" icon={<GrPowerReset />} />
        </fieldset>
    );
}
