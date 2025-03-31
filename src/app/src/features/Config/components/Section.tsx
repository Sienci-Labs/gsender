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

interface SectionProps {
    title: string;
    children?: React.ReactNode;
    activeSection?: number;
    key: string;
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
            eeprom,
            wizard = null,
        }: SectionProps,
        ref,
    ) => {
        const { searchTerm, connected } = useSettings();

        const filteredSettings = settings.filter((o) =>
            matchesSearchTerm(o, searchTerm),
        );

        const filterEmpty = filteredSettings.length === 0;

        function onlyEEPROM(settings) {
            let onlyEEPROM = false;
            settings.map((settingSec) => {});
            return onlyEEPROM;
        }
        let shownWarning = false;

        return (
            <div
                id={id}
                className={cn({
                    hidden: filterEmpty || (!connected && onlyEEPROM(settings)),
                })}
                ref={ref}
            >
                <div className="flex flex-row gap-8 py-2">
                    <h1 className="mb-2 text-3xl ml-4 font-sans dark:text-white">
                        {title}
                    </h1>
                    {wizard && wizard()}
                </div>
                <div className="bg-gray-100 rounded-xl shadow p-6 dark:bg-dark dark:text-white">
                    {settings.map((setting: gSenderSubSection, index) => {
                        if (!connected && onlyEEPROM(setting.settings)) {
                            if (!shownWarning) {
                                shownWarning = true;
                                return <></>;
                            } else {
                                return <></>;
                            }
                        } else {
                            return (
                                <SettingSection
                                    settings={setting.settings}
                                    label={setting.label}
                                    wizard={setting.wizard}
                                />
                            );
                        }
                    })}
                </div>
            </div>
        );
    },
);
