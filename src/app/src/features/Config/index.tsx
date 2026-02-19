import React, { MouseEventHandler, useEffect } from 'react';
import { Menu } from './components/Menu';
import { Section } from './components/Section';
import { Search } from 'app/features/Config/components/Search.tsx';
import { ApplicationPreferences } from 'app/features/Config/components/ApplicationPreferences.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext';
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
import controller from 'app/lib/controller.ts';
import { GRBLHAL } from 'app/constants';
import { resolveGrblCoreDefaults } from 'app/features/Config/utils/grblCoreMigration.ts';

export function Config() {
    const { ref: inViewRef } = useInView({
        threshold: 0.2,
    });

    const connected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const firmwareType = useTypedSelector(
        (state: RootState) => state.controller.type,
    );
    const [visibleSection, setVisibleSection] = React.useState('h-section-0');
    const [activeTab, setActiveTab] = React.useState('config');

    function setInView(inView: any, entry: any) {
        if (inView) {
            setVisibleSection(entry.target.getAttribute('id'));
        }
    }

    /*useEffect(() => {
        if (connected) {
            if (firmwareType === 'grblHAL') {
                controller.command('gcode', ['$$', '$ESH', '$ES']);
            } else {
                controller.command('gcode', '$$');
            }
        }
    }, []);*/

    useEffect(() => {
        if (connected) {
            controller.command('gcode', ['$$']);
        }
    }, []);

    const { settings, EEPROM, machineProfile } = useSettings();
    const reportedEEPROM = useTypedSelector(
        (state: RootState) => state.controller.settings.settings,
    );
    const firmwareSemver = useTypedSelector(
        (state: RootState) => state.controller.settings.version?.semver,
    );

    useEffect(() => {
        if (!reportedEEPROM || Object.keys(reportedEEPROM).length === 0) {
            return;
        }

        let baseDefaults: Record<string, string> = {};
        let orderedSettings: Map<string, string> | undefined;

        if (firmwareType === GRBLHAL) {
            const resolved = resolveGrblCoreDefaults({
                firmwareSemver,
                baseDefaults: machineProfile.grblHALeepromSettings || {},
                orderedSettings: machineProfile.orderedSettings,
            });
            baseDefaults = resolved.defaults;
            orderedSettings = resolved.ordered as Map<string, string> | undefined;
        } else {
            baseDefaults = machineProfile.eepromSettings || {};
            orderedSettings = machineProfile.orderedSettings;
        }

        const defaultKeys = new Set<string>([
            ...Object.keys(baseDefaults),
            ...(orderedSettings ? Array.from(orderedSettings.keys()) : []),
        ]);

        const missingDefaults = Object.keys(reportedEEPROM)
            .filter((key) => !defaultKeys.has(key))
            .sort(
                (a, b) =>
                    Number(a.replace('$', '')) - Number(b.replace('$', '')),
            );

        if (missingDefaults.length > 0) {
            console.info(
                `EEPROM defaults missing (${missingDefaults.length}):`,
                missingDefaults.join(', '),
            );
        }
    }, [
        reportedEEPROM,
        firmwareType,
        firmwareSemver,
        machineProfile?.id,
    ]);

    // lets extract all the eeprom settings
    let allEEPROM: gSenderSetting[] = EEPROM.map((filtered, i) => {
        const formatted: gSenderSetting = {
            type: 'eeprom',
            description: filtered.description,
            unit: filtered.unit,
            eID: filtered.setting,
            globalIndex: filtered.globalIndex,
            value: filtered.value,
            defaultValue: filtered.defaultValue,
        };
        return formatted;
    });
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

    function navigateToSection(
        _e: MouseEventHandler<HTMLButtonElement>,
        index: number,
    ) {
        document
            .getElementById(`section-${index}`)
            .scrollIntoView({ behavior: 'instant' });
        setTimeout(() => {
            setVisibleSection(`h-section-${index}`);
        }, 50);
    }

    return (
        <div className="w-full flex flex-grow-0 shadow bg-white overflow-y-hidden box-border no-scrollbar dark:bg-dark">
            {activeTab === 'config' ? (
                <Menu
                    menu={settings}
                    onClick={navigateToSection}
                    activeSection={visibleSection}
                />
            ) : (
                <div className="flex flex-col w-1/5 border border-gray-200 border-l-0 pl-1 divide-y bg-white dark:bg-dark dark:border-gray-700 dark:text-white" />
            )}
            <div className="flex flex-col fixed-content-area w-4/5">
                <div className="min-h-1/5 bg-white border border-bottom border-gray-200 flex flex-row justify-between gap-2 items-center pl-24 max-xl:pl-5 dark:bg-dark dark:border-gray-700">
                    <Search />
                    <FilterDefaultToggle />
                    <ApplicationPreferences />
                </div>
                <Tabs defaultValue="config">
                    <TabsList className="w-full pb-0 border-b rounded-b-none">
                        <TabsTrigger
                            value="config"
                            className="w-full dark:text-white"
                            onClick={() => setActiveTab('config')}
                        >
                            All Config
                        </TabsTrigger>
                        <TabsTrigger
                            value="eeprom"
                            className="w-full dark:text-white"
                            onClick={() => setActiveTab('eeprom')}
                        >
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
                        </div>
                    </TabsContent>
                    <TabsContent
                        value="eeprom"
                        className="flex flex-col fixed-config-area"
                    >
                        <div
                            className="px-10 max-xl:px-2 gap-8 pt-4 mb-24 box-border flex flex-col overflow-y-scroll relative"
                            ref={inViewRef}
                        >
                            <EEPROMNotConnectedWarning connected={connected} />
                            {eepromSettings.map((item, index) => {
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
                                                    connected={connected}
                                                    wizard={item.wizard}
                                                    showEEPROMOnly={true}
                                                    ref={ref}
                                                />
                                            );
                                        }}
                                    </InView>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
                <ProfileBar />
            </div>
        </div>
    );
}
