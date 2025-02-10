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
    const [showFlashDialog, setShowFlashDialog] = React.useState(false);

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
            <div className="w-full flex flex-grow-0 shadow bg-gray-50 overflow-y-hidden box-border no-scrollbar">
                <Menu
                    menu={SettingsMenu}
                    onClick={navigateToSection}
                    activeSection={activeSection}
                />
                <div className="flex flex-col h-full max-h-[calc(100vh-64px)] w-4/5">
                    <div className="min-h-1/5 bg-white border border-bottom border-gray-200 flex flex-row justify-between gap-2 items-center pl-24">
                        <Search />
                        <ApplicationPreferences />
                    </div>
                    <div className="px-10 gap-4 mt-4 box-border flex-1 overflow-y-scroll relative no-scrollbar">
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
                        <ProfileBar
                            setShowFlashDialog={() => {
                                setShowFlashDialog(!showFlashDialog);
                            }}
                        />
                    </div>
                </div>
            </div>
        </SettingsProvider>
    );
}
