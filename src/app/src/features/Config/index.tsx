import React, { MouseEventHandler } from 'react';
import { Menu } from './components/Menu';
import { Section } from './components/Section';
import { Search } from 'app/features/Config/components/Search.tsx';
import { ApplicationPreferences } from 'app/features/Config/components/ApplicationPreferences.tsx';
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'app/components/shadcn/Tabs';
import { gSenderSetting, SettingsMenuSection } from './assets/SettingsMenu';
import { convertEIDToNumber } from 'app/lib/numeral';

export function Config() {
    // const [activeSection, setActiveSection] = React.useState<number>(0);
    // const [showFlashDialog, setShowFlashDialog] = React.useState(false);
    const { ref: inViewRef } = useInView({
        threshold: 0.2,
    });

    const connected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const [visibleSection, setVisibleSection] = React.useState('h-section-0');

    function setInView(inView: any, entry: any) {
        if (inView) {
            setVisibleSection(entry.target.getAttribute('id'));
        }
    }

    const { settings } = useSettings();

    // lets extract all the eeprom settings
    let allEEPROM: gSenderSetting[] = settings
        .flatMap((section) => section.settings)
        .flatMap((subSection) => subSection.settings)
        .filter((setting) => setting.eID);
    // sort so they are in order of EEPROM
    allEEPROM.sort(
        (a, b) => convertEIDToNumber(a.eID) - convertEIDToNumber(b.eID),
    );
    const eepromSettings: SettingsMenuSection[] = [
        {
            label: '',
            icon: null,
            settings: [
                {
                    label: '',
                    settings: allEEPROM,
                },
            ],
        },
    ];

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
        _e: MouseEventHandler<HTMLButtonElement>,
        index: number,
    ) {
        document
            .getElementById(`section-${index}`)
            .scrollIntoView({ behavior: 'instant' });
        // setActiveSection(index);
        setTimeout(() => {
            setVisibleSection(`h-section-${index}`);
        }, 50);
    }

    return (
        <SettingsProvider>
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
                    <Tabs defaultValue="config">
                        <TabsList className="w-full pb-0 border-b rounded-b-none">
                            <TabsTrigger value="config" className="w-full">
                                All Config
                            </TabsTrigger>
                            <TabsTrigger value="eeprom" className="w-full">
                                EEPROM
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent
                            value="config"
                            className="flex flex-col fixed-config-area"
                        >
                            <div
                                className="px-10 max-xl:px-2 gap-8 pt-4 mb-24 box-border flex flex-col overflow-y-scroll relative"
                                ref={inViewRef}
                            >
                                <EEPROMNotConnectedWarning
                                    connected={connected}
                                />
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
                            </div>
                        </TabsContent>
                        <TabsContent
                            value="eeprom"
                            className="flex flex-col fixed-config-area"
                        >
                            <div className="px-10 max-xl:px-2 gap-8 pt-4 mb-24 box-border flex flex-col overflow-y-scroll relative">
                                <EEPROMNotConnectedWarning
                                    connected={connected}
                                />
                                {eepromSettings.map((item, index) => {
                                    return (
                                        <Section
                                            title={item.label}
                                            key={`section-${index}`}
                                            id={`section-${index}`}
                                            index={index}
                                            settings={item.settings}
                                            eeprom={item.eeprom}
                                            connected={connected}
                                            wizard={item.wizard}
                                            showEEPROMOnly={true}
                                        />
                                    );
                                })}
                            </div>
                        </TabsContent>
                    </Tabs>
                    <ProfileBar
                    // setShowFlashDialog={() => {
                    //     setShowFlashDialog(!showFlashDialog);
                    // }}
                    />
                </div>
            </div>
        </SettingsProvider>
    );
}
