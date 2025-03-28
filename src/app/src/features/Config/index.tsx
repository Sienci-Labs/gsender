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
import { useInView, InView } from 'react-intersection-observer';

export function Config() {
    const [activeSection, setActiveSection] = React.useState<number>(0);
    const [showFlashDialog, setShowFlashDialog] = React.useState(false);
    const { inViewRef, inView } = useInView({
        threshold: 0.2,
    });
    const [visibleSection, setVisibleSection] = React.useState('section-0');

    function setInView(inView, entry) {
        if (inView) {
            setVisibleSection(entry.target.getAttribute('id'));
        }
    }

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
            <div className="w-full flex flex-grow-0 shadow bg-white overflow-y-hidden box-border no-scrollbar dark:bg-dark">
                <Menu
                    menu={SettingsMenu}
                    onClick={navigateToSection}
                    activeSection={visibleSection}
                />
                {
                    //h-[calc(100vh-64px)] max-h-[calc(100vh-64px)]
                }
                <div className="flex flex-col fixed-content-area w-4/5">
                    <div className="min-h-1/5 bg-white border border-bottom border-gray-200 flex flex-row justify-between gap-2 items-center pl-24 dark:bg-dark dark:border-gray-700">
                        <Search />
                        <ApplicationPreferences />
                    </div>
                    <div
                        className="px-10 gap-8 pt-4 mb-36 box-border flex flex-col overflow-y-scroll relative"
                        ref={inViewRef}
                    >
                        {settings.map((item, index) => {
                            return (
                                <InView
                                    key={`IV-section-${index}`}
                                    onChange={setInView}
                                    threshold={0.2}
                                >
                                    {({ ref }) => {
                                        return (
                                            <Section
                                                title={item.label}
                                                key={`section-${index}`}
                                                id={`section-${index}`}
                                                index={index}
                                                settings={item.settings}
                                                eeprom={item.eeprom}
                                                ref={ref}
                                                wizard={item.wizard}
                                            />
                                        );
                                    }}
                                </InView>
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
