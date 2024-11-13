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
import {EEPROMSection} from "app/features/Config/components/EEPROMSection.tsx";

interface SectionProps {
    title: string;
    children?: React.ReactNode;
    activeSection?: number;
    key: string;
    id: string;
    index: number;
    settings: gSenderSettings[];
    eeprom?: gSenderEEEPROMSettings
}

function returnSettingControl(setting: gSenderSetting) {
    switch (setting.type) {
        case 'boolean':
            return <BooleanSettingInput value={setting.value as boolean} />;
        case 'select':
            return <SelectSettingInput options={setting.options} />;
        case 'number':
            return <NumberSettingInput unit={setting.unit} />;
        case 'radio':
            return <RadioSettingInput options={setting.options} />;
        default:
            return setting.type;
    }
}

function settingRow(setting: gSenderSetting) {
    return (
        <div className="odd:bg-gray-100 even:bg-white p-2 flex flex-row items-center">
            <span className="w-1/5">{setting.label}</span>
            <span className="w-1/5 text-xs px-4">
                {returnSettingControl(setting)}
            </span>
            <span></span>
            <span className="text-gray-500 text-sm w-2/5">
                {setting.description || ''}
            </span>
        </div>
    );
}

function subSection(setting: gSenderSubSection) {
    return (
        <div>
            <h2 className="blue-">{setting.label}</h2>
            {setting.settings.map((s) => settingRow(s))}
        </div>
    );
}

export function isSubSection(
    setting: gSenderSettings,
): setting is gSenderSubSection {
    return 'label' in setting && 'settings' in setting;
}

export function Section({ title, settings = [], key, id, eeprom = [] }: SectionProps) {
    return (
        <div id={id}>
            <h1 className="mb-2 text-3xl ml-4 font-sans">{title}</h1>
            <div className="bg-white rounded-xl shadow p-6">
                {settings.map((setting: gSenderSettings) => {
                    if (isSubSection(setting)) {
                        return subSection(setting);
                    }
                    return settingRow(setting);
                })}
                {
                    eeprom && (eeprom?.length > 0) && <EEPROMSection />
                }
            </div>
        </div>
    );
}
