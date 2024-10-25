import React from 'react';
import {
    gSenderEEPROMSetting,
    gSenderSetting,
} from 'app/features/Config/assets/SettingsMenu.ts';

interface SectionProps {
    title: string;
    children?: React.ReactNode;
    activeSection?: number;
    key: string;
    settings: gSenderSetting[];
}

function settingRow(setting: gSenderSetting) {
    return (
        <div className="odd:bg-gray-100 even:bg-white p-2 flex flex-row items-center">
            <span className="w-1/5">{setting.label}</span>
            <span className="w-1/5 text-xs">CTRL</span>
            <span></span>
            <span className="text-gray-500 text-sm w-2/5">
                {setting.description || ''}
            </span>
        </div>
    );
}

export function Section({ title, settings = [] }: SectionProps) {
    return (
        <div>
            <h1 className="mb-2 text-3xl ml-4 font-sans">{title}</h1>
            <div className="bg-white rounded-xl shadow p-6">
                {settings.map((setting) => settingRow(setting))}
            </div>
        </div>
    );
}
