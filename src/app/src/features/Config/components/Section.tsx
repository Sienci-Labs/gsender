import React from 'react';
import {
    gSenderEEEPROMSettings,
    gSenderSettings,
    gSenderSubSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { SettingSection } from 'app/features/Config/components/SettingSection.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import cn from 'classnames';

interface SectionProps {
    title: string;
    children?: React.ReactNode;
    activeSection?: number;
    key: string;
    connected?: boolean;
    id: string;
    index: number;
    settings: gSenderSettings[];
    eeprom?: gSenderEEEPROMSettings;
    wizard?: () => JSX.Element;
}

export const Section = React.forwardRef(
    (
        {
            title,
            children,
            activeSection,
            key,
            id,
            index,
            settings,
            connected = false,
            eeprom,
            wizard = null,
        }: SectionProps,
        ref,
    ) => {
        const { settingsFilter } = useSettings();

        const filteredSettings = settings.map((s: gSenderSubSection) => {
            const fs = { ...s };
            fs.settings = fs.settings.filter((o) => settingsFilter(o));
            return fs;
        });

        const settingsAvailable = filteredSettings.reduce(
            (a, b) => a + b.settings.length,
            0,
        );
        return (
            <div
                id={id}
                className={cn({
                    hidden: settingsAvailable === 0,
                })}
                ref={ref}
            >
                <div className="flex flex-row gap-8 py-2">
                    <h1 className="mb-2 text-3xl ml-4 font-sans dark:text-white">
                        {title}
                    </h1>
                    {connected && wizard && wizard()}
                </div>
                <div className="bg-gray-100 rounded-xl shadow p-6 flex flex-col gap-6 dark:bg-dark dark:text-white">
                    {filteredSettings.map(
                        (setting: gSenderSubSection, index) => {
                            return (
                                <SettingSection
                                    connected={connected}
                                    settings={setting.settings}
                                    label={setting.label}
                                    wizard={setting.wizard}
                                />
                            );
                        },
                    )}
                </div>
            </div>
        );
    },
);
