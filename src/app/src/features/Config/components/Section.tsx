import React from 'react';
import {
    gSenderEEEPROMSettings,
    gSenderSetting,
    gSenderSettings,
    gSenderSubSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { BooleanSettingInput } from 'app/features/Config/components/SettingInputs/BooleanSettingInput.tsx';
import { SelectSettingInput } from 'app/features/Config/components/SettingInputs/SelectSettingInput.tsx';
import { NumberSettingInput } from 'app/features/Config/components/SettingInputs/NumberSettingInput.tsx';
import { RadioSettingInput } from 'app/features/Config/components/SettingInputs/RadioSettingInput.tsx';
import { EEPROMSection } from 'app/features/Config/components/EEPROMSection.tsx';
import { IPSettingInput } from 'app/features/Config/components/SettingInputs/IP.tsx';
import { HybridNumber } from 'app/features/Config/components/SettingInputs/HybridNumber.tsx';
import { SettingRow } from 'app/features/Config/components/SettingRow.tsx';
import { SettingSection } from 'app/features/Config/components/SettingSection.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { matchesSearchTerm } from 'app/features/Config/utils/Settings.ts';
import { cn } from 'app/lib/utils.ts';

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
    const { searchTerm } = useSettings();

    const filteredSettings = settings.filter((o) =>
        matchesSearchTerm(o, searchTerm),
    );
    console.log(filteredSettings);

    return (
        <div id={id} className={cn({ hidden: filteredSettings.length === 0 })}>
            <h1 className="mb-2 text-3xl ml-4 font-sans">{title}</h1>
            <div className="bg-white rounded-xl shadow p-6">
                {settings.map((setting: gSenderSubSection, index) => (
                    <SettingSection
                        settings={setting.settings}
                        label={setting.label}
                    />
                ))}
                {eeprom && eeprom?.length > 0 && (
                    <EEPROMSection
                        label={`${title} EEPROM`}
                        settings={eeprom}
                    />
                )}
            </div>
        </div>
    );
}
