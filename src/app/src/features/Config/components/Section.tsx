import React from 'react';
import {
    gSenderEEEPROMSettings,
    gSenderSettings,
    gSenderSubSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { SettingSection } from 'app/features/Config/components/SettingSection.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { matchesSearchTerm } from 'app/features/Config/utils/Settings.ts';
import cn from 'classnames';
import { EmptySectionWarning } from 'app/features/Config/components/EmptySectionWarning.tsx';

interface SectionProps {
    title: string;
    children?: React.ReactNode;
    activeSection?: number;
    key: string;
    id: string;
    index: number;
    settings: gSenderSettings[];
    eeprom?: gSenderEEEPROMSettings;
}

export function Section({
    title,
    settings = [],
    key,
    id,
    eeprom = [],
}: SectionProps) {
    const { searchTerm, connected } = useSettings();

    const filteredSettings = settings.filter((o) =>
        matchesSearchTerm(o, searchTerm),
    );

    const filterEmpty = filteredSettings.length === 0;

    function onlyEEPROM(settings) {
        return settings.filter((o) => o.type !== 'eeprom').length === 0;
    }
    let shownWarning = false;

    return (
        <div id={id} className={cn({ 'invisible opacity-0': filterEmpty })}>
            <h1 className="mb-2 text-3xl ml-4 font-sans">{title}</h1>
            <div className="bg-white rounded-xl shadow p-6">
                {settings.map((setting: gSenderSubSection, index) => {
                    if (!connected && onlyEEPROM(setting.settings)) {
                        if (!shownWarning) {
                            shownWarning = true;
                            return <EmptySectionWarning />;
                        } else {
                            return <></>;
                        }
                    } else {
                        return (
                            <SettingSection
                                settings={setting.settings}
                                label={setting.label}
                            />
                        );
                    }
                })}
            </div>
        </div>
    );
}
