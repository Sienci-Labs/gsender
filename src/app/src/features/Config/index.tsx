import React, { MouseEventHandler } from 'react';
import { Menu } from './components/Menu';
import { Section } from './components/Section';
import { Search } from 'app/features/Config/components/Search.tsx';
import { ApplicationPreferences } from 'app/features/Config/components/ApplicationPreferences.tsx';
import { SettingsMenu } from './assets/SettingsMenu';
import {
    SettingsProvider,
    useSettings,
} from 'app/features/Config/utils/SettingsContext';
import { ProfileBar } from 'app/features/Config/components/ProfileBar.tsx';

export function Config() {
    const [activeSection, setActiveSection] = React.useState<number>(0);
    const { settings } = useSettings();

    function navigateToSection(
        e: MouseEventHandler<HTMLButtonElement>,
        index: number,
    ) {
        setActiveSection(index);
        document
            .getElementById(`section-${index}`)
            .scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <SettingsProvider>
            <div className="w-full flex h-[85%] shadow bg-gray-50 overflow-y-hidden-clip box-border">
                <Menu
                    menu={SettingsMenu}
                    onClick={navigateToSection}
                    activeSection={activeSection}
                />
                <div className="flex flex-col flex-1 overflow-clip">
                    <div className="min-h-1/5 bg-white border border-bottom border-gray-200 flex flex-row justify-between gap-2 items-center pl-24">
                        <Search />
                        <ApplicationPreferences />
                    </div>
                    <div className="px-10 min-h-3/5 flex gap-4 flex-col mt-4 box-border overflow-y-auto">
                        {settings.map((item, index) => {
                            return (
                                <Section
                                    title={item.label}
                                    key={`section-${index}`}
                                    id={`section-${index}`}
                                    index={index}
                                    settings={item.settings}
                                    eeprom={item.eeprom}
                                />
                            );
                        })}
                    </div>
                    <ProfileBar />
                </div>
            </div>
        </SettingsProvider>
    );
}
