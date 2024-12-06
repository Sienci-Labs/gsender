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

function settingRow(setting: gSenderSetting, index: number, subIndex = -1) {
    return (
        <div className="odd:bg-gray-100 even:bg-white p-2 flex flex-row items-center">
            <span className="w-1/5">{setting.label}</span>
            <span className="w-1/5 text-xs px-4">
                {returnSettingControl(setting, index)}
            </span>
            <span></span>
            <span className="text-gray-500 text-sm w-2/5">
                {setting.description}
            </span>
        </div>
    );
}

export function isSubSection(
    setting: gSenderSettings,
): setting is gSenderSubSection {
    return 'label' in setting && 'settings' in setting;
}

export function Section({
    title,
    settings = [],
    key,
    id,
    eeprom = [],
}: SectionProps) {
    return (
        <div id={id}>
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
