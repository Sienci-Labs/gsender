import React, { MouseEventHandler } from 'react';
import { Menu } from './components/Menu';
import { Section } from './components/Section';
import { Search } from 'app/features/Config/components/Search.tsx';
import { ApplicationPreferences } from 'app/features/Config/components/ApplicationPreferences.tsx';
import { SettingsMenu } from './assets/SettingsMenu';

export function Config() {
    const [activeSection, setActiveSection] = React.useState<number>(0);

    function navigateToSection(
        e: MouseEventHandler<HTMLButtonElement>,
        index: number,
    ) {
        setActiveSection(index);
    }

    return (
        <div className="h-full w-full m-auto  mb-6 shadow flex flex-col items-stretch justify-stretch content-stretch bg-gray-50">
            <div className="min-h-32 bg-white border border-bottom border-gray-200 flex flex-row justify-between gap-2 items-center pl-80">
                <Search />
                <ApplicationPreferences />
            </div>
            <div className="flex flex-row h-[calc(80vh-8rem)]">
                <Menu
                    menu={SettingsMenu}
                    onClick={navigateToSection}
                    activeSection={activeSection}
                />
                <div className="px-10 flex flex-1  w-full gap-4 flex-col mt-4 overflow-clip box-border overflow-y-scroll">
                    {SettingsMenu.map((item, index) => {
                        return (
                            <Section
                                title={item.label}
                                key={`section-${index}`}
                                settings={item.settings}
                            >
                                THIS IS A SECTION
                            </Section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
