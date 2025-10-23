import React, { MouseEventHandler } from 'react';
import { Menu } from './components/Menu';
import { Section } from './components/Section';
import { Search } from 'app/features/Config/components/Search.tsx';
import { ApplicationPreferences } from 'app/features/Config/components/ApplicationPreferences.tsx';
import { gSenderSubSection, SettingsMenu } from './assets/SettingsMenu';
import {
    SettingsProvider,
    useSettings,
} from 'app/features/Config/utils/SettingsContext';
import { ProfileBar } from 'app/features/Config/components/ProfileBar.tsx';
import { useInView, InView } from 'react-intersection-observer';
import { EEPROMNotConnectedWarning } from 'app/features/Config/components/EEPROMNotConnectedWarning.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { FilterDefaultToggle } from 'app/features/Config/components/FilterDefaultToggle.tsx';

export function Config() {
    const [activeSection, setActiveSection] = React.useState<number>(0);
    const [showFlashDialog, setShowFlashDialog] = React.useState(false);
    const { inViewRef, inView } = useInView({
        threshold: 0.2,
    });

    const connected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const [visibleSection, setVisibleSection] = React.useState('h-section-0');

    function setInView(inView, entry) {
        if (inView) {
            setVisibleSection(entry.target.getAttribute('id'));
        }
    }

    const { settings } = useSettings();
    /*
    const filteredSettings = settings.map((section) => {
        const newSection = { ...section };
        newSection.settings = section.settings.map((ss) => {
            const fs = { ...ss };
            fs.settings = fs.settings.filter((o) => settingsFilter(o));
            return fs;
        });
        return newSection;
    });
    console.log(filteredSettings);
    */
    function navigateToSection(
        e: MouseEventHandler<HTMLButtonElement>,
        index: number,
    ) {
        document
            .getElementById(`section-${index}`)
            .scrollIntoView({ behavior: 'instant' });
        setActiveSection(index);
        setTimeout(() => {
            setVisibleSection(`h-section-${index}`);
        }, 50);
    }

    return (
        <div className="w-full flex flex-grow-0 shadow bg-white overflow-y-hidden box-border no-scrollbar dark:bg-dark">
            <Menu
                menu={settings}
                onClick={navigateToSection}
                activeSection={visibleSection}
            />
            <div className="flex flex-col fixed-content-area w-4/5">
                <div className="min-h-1/5 bg-white border border-bottom border-gray-200 flex flex-row justify-between gap-2 items-center pl-24 max-xl:pl-5 dark:bg-dark dark:border-gray-700">
                    <Search />
                    <FilterDefaultToggle />
                    <ApplicationPreferences />
                </div>
                <div
                    className="px-10 max-xl:px-2 gap-8 pt-4 mb-24 box-border flex flex-col overflow-y-scroll relative"
                    ref={inViewRef}
                >
                    <EEPROMNotConnectedWarning connected={connected} />
                    {settings.map((item, index) => {
                        return (
                            <InView
                                key={`IV-section-${index}`}
                                onChange={setInView}
                                threshold={0}
                                rootMargin="0px 0px -75% 0px"
                                className={'bg-red-500'}
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
                                            connected={connected}
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
    );
}
