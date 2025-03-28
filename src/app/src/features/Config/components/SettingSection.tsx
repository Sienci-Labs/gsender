import {
    gSenderSetting,
    gSenderSubSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { SettingRow } from 'app/features/Config/components/SettingRow.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { matchesSearchTerm } from 'app/features/Config/utils/Settings.ts';
import cn from 'classnames';
import { EmptySectionWarning } from 'app/features/Config/components/EmptySectionWarning.tsx';
import React from 'react';

interface SettingSectionProps {
    settings: gSenderSetting[];
    label?: string;
    wizard?: () => JSX.Element;
}
export function SettingSection({
    settings = [],
    label = null,
    wizard,
}: SettingSectionProps): JSX.Element {
    const { setSettingsValues, setSettingsAreDirty, searchTerm, connected } =
        useSettings();
    const changeHandler = (i) => (v) => {
        setSettingsAreDirty(true);

        setSettingsValues((prev) => {
            const updated = [...prev];
            updated[i].value = v;
            updated[i].dirty = true;
            return updated;
        });
    };

    const filteredSettings = settings.filter((o) =>
        matchesSearchTerm(o, searchTerm),
    );

    return (
        <div
            className={cn(
                'divide-solid divide-y divide-gray-300 dark:divide-gray-700',
                {
                    'hidden text-gray-600': filteredSettings.length === 0,
                },
            )}
        >
            {label && (
                <div className="flex flex-row gap-8 border-b border-blue-500 mt-4 py-2">
                    <h2 className="text-blue-500 dark:text-white text-xl">
                        {label}
                    </h2>
                    {wizard && wizard()}
                </div>
            )}
            {filteredSettings.map((setting) => {
                return (
                    <SettingRow
                        setting={setting}
                        changeHandler={changeHandler}
                    />
                );
            })}
        </div>
    );
}
