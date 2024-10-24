import React, { MouseEventHandler } from 'react';
import { Menu } from './components/Menu';
import { Section } from './components/Section';
import { Search } from 'app/features/Config/components/Search.tsx';
import { ApplicationPreferences } from 'app/features/Config/components/ApplicationPreferences.tsx';

export function Config() {
    const [activeSection, setActiveSection] = React.useState<number>(0);

    function navigateToSection(
        e: MouseEventHandler<HTMLButtonElement>,
        index: number,
    ) {
        setActiveSection(index);
    }

    const menu = [
        'Basics',
        'Safety',
        'Motors',
        'Probe',
        'Limit Switches',
        'Spindle/Laser',
        'Tool Changing',
        'Rotary',
        'Automations',
        'Shortcuts',
        'Customize UI',
        'About',
    ];
    return (
        <div className="h-full w-4/5 m-auto mt-6 mb-6 shadow flex flex-col items-stretch justify-stretch content-stretch bg-gray-50">
            <div className="min-h-32 bg-white border border-bottom border-gray-200 flex flex-row justify-end gap-2 items-center">
                <Search />
                <ApplicationPreferences />
            </div>
            <div className="flex flex-row h-[calc(80vh-8rem)]">
                <Menu
                    menu={menu}
                    onClick={navigateToSection}
                    activeSection={activeSection}
                />
                <div className="px-10 flex flex-1  w-full gap-4 flex-col mt-4 overflow-clip box-border overflow-y-scroll">
                    {menu.map((item, index) => {
                        return (
                            <Section title={item} key={`section-${index}`}>
                                THIS IS A SECTION
                            </Section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
