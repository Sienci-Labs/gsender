import {
    gSenderSetting,
    SettingsMenu,
    SettingsMenuSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import store from 'app/store';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';

import {
    GRBL_HAL_SETTINGS,
    GRBL_SETTINGS,
} from 'app/features/Config/assets/SettingsDescriptions.ts';
import { GRBLHAL } from 'app/constants';
import { getFilteredEEPROMSettings } from 'app/features/Config/utils/EEPROM.ts';
import get from 'lodash/get';
import defaultStoreState from 'app/store/defaultState';
import { boolean } from 'zod';
import isEqual from 'lodash/isEqual';
import machineProfiles from 'app/features/Config/assets/MachineDefaults/defaultMachineProfiles.ts';

interface iSettingsContext {
    settings: SettingsMenuSection[];
    EEPROM?: object;
    settingsToUpdate?: object;
    EEPROMToUpdate?: object;
    machineProfile: object;
    rawEEPROM: object;
    firmwareType: 'Grbl' | 'GrblHAL';
    setMachineProfile: (v) => void;
    setEEPROM: (v) => void;
    connected: boolean;
    settingsAreDirty: boolean;
    setSettingsAreDirty: (v) => void;
    searchTerm: string;
    setSearchTerm: (v) => void;
    settingsValues: gSenderSetting[];
    setSettingsValue: (v) => void;
    settingsFilter: (v) => boolean;
    setFilterNonDefault: () => void;
}

interface SettingsProviderProps {
    children: React.ReactNode;
}

const defaultState = {
    settings: SettingsMenu,
    settingsToUpdate: {},
    EEPROMToUpdate: {},
    EEPROM: {},
    rawEEPROM: {},
    machineProfile: {},
    firmwareType: 'Grbl',
    connected: false,
    settingsAreDirty: false,
    settingsValues: [],
    settingsFilter: (v) => true,
    toggleFilterNonDefault: () => {},
    filterNonDefault: boolean,
};

export const SettingsContext =
    React.createContext<iSettingsContext>(defaultState);

export function useSettings() {
    const context = React.useContext(SettingsContext);
    if (!context) {
        console.error('useSettings must be used within SettingsContext');
    }
    return context;
}

export function isSettingDefault(v) {
    if ('key' in v) {
        return isEqual(v.value, v.defaultValue);
    }
    return true; // Default to true to non-key settings aren't always highlighted.
}

function fetchStoreValue(key) {
    return store.get(key);
}

function fetchDefaultValue(key) {
    return get(defaultStoreState, key, null);
}

export function hasSettingsToApply(settings: object, eeprom: object) {
    return Object.keys(settings).length > 0 || Object.keys(eeprom).length > 0;
}

function populateSettingsValues(settingsSections: SettingsMenuSection[] = []) {
    const globalValueReference = [];
    let index = 0;
    if (!settingsSections.length) {
        return;
    }
    settingsSections.map((ss) => {
        if (!ss || !ss.settings) {
            return;
        }
        ss.settings.map((s) => {
            s.settings.map((o) => {
                if (o.key && o.key.length > 0) {
                    o.value = fetchStoreValue(o.key);
                    o.globalIndex = index;
                    o.defaultValue = fetchDefaultValue(o.key);
                    globalValueReference.push({ ...o });
                    index++;
                }
            });
        });
    });

    return [settingsSections, globalValueReference];
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const [settings, setSettings] =
        useState<SettingsMenuSection[]>(SettingsMenu);
    const [EEPROM, setEEPROM] = useState<object>([]);
    const [rawEEPROM, setRawEEPROM] = useState<object>({});
    const [machineProfile, setMachineProfile] = useState({});
    const [connected, setConnected] = useState(false);
    const [settingsAreDirty, setSettingsAreDirty] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [settingsValues, setSettingsValues] = useState([]);
    const [filterNonDefault, setFilterNonDefault] = useState(false);

    const detectedEEPROM = useSelector(
        (state: RootState) => state.controller.settings.settings,
    );

    const detectedEEPROMDescriptions = useSelector(
        (state: RootState) => state.controller.settings.descriptions,
    );

    const detectedEEPROMGroups = useSelector(
        (state: RootState) => state.controller.settings.groups,
    );

    const controllerType = useSelector(
        (state: RootState) => state.controller.type,
    );

    const connectionState = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const BASE_SETTINGS =
        controllerType === GRBLHAL ? GRBL_HAL_SETTINGS : GRBL_SETTINGS;

    useEffect(() => {
        const storeMachineProfile = store.get('workspace.machineProfile', {});
        // lookup latest values as set for this machine ID
        const latest = machineProfiles.find(
            (o) => o.id === storeMachineProfile.id,
        );

        if (!latest) {
            console.error(
                'No machine profile with this ID found, using previous value.',
            );
            return setMachineProfile(storeMachineProfile);
        }
        setMachineProfile(latest);
    }, []);

    useEffect(() => {
        const [populatedSettings, globalValues] =
            populateSettingsValues(settings);
        setSettings([...populatedSettings]);
        setSettingsValues([...globalValues]);
    }, []);

    useEffect(() => {
        setRawEEPROM(detectedEEPROM);
    }, [detectedEEPROM]);

    useEffect(() => {
        setConnected(connectionState);
    }, [connectionState]);

    useEffect(() => {
        setEEPROM(
            getFilteredEEPROMSettings(
                BASE_SETTINGS,
                detectedEEPROM,
                detectedEEPROMDescriptions,
                detectedEEPROMGroups,
            ),
        );
    }, [detectedEEPROM, detectedEEPROMDescriptions, detectedEEPROMGroups]);

    /**
     * Filter for general settings.
     * Filter EEPROM if not connected
     * Filter EEPROM if no Value
     * Filter remaining by matching search term
     * @param v - The setting to filter
     */
    function settingsFilter(v) {
        if (v.type === 'eeprom' || v.type === 'hybrid') {
            // Always exclude eeprom/hybrids when not connected
            if (!connectionState) {
                return false;
            }
            const EEPROMData = EEPROM.find((s) => s.setting === v.eID);

            // can't find a relevant value, we hide it
            if (!EEPROMData) {
                return false;
            }
            // If filterNonDefault is enabled, make sure the current value equals the default value
            if (filterNonDefault) {
                if (EEPROMData) {
                    return !eepromIsDefault(EEPROMData);
                }
                return false; // We don't know, default to hide
            }
        }

        // Filter non-default gSender settings if they are store values (have a key)
        if (filterNonDefault && 'key' in v) {
            if ('defaultValue' in v) {
                return !isEqual(
                    settingsValues[v.globalIndex].value,
                    v.defaultValue,
                );
            }
            return false;
        }

        if (filterNonDefault) {
            if (v.type === 'wizard' || v.type === 'event') {
                // we don't have defaults for these
                return false;
            }
        }

        if (searchTerm.length === 0 || !searchTerm) {
            return true;
        }

        // Hide hidden when filtering
        if ('hidden' in v) {
            return !v.hidden();
        }

        if (v)
            return JSON.stringify(v)
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
    }

    function eepromIsDefault(settingData) {
        const profileDefaults =
            controllerType === 'Grbl'
                ? machineProfile.eepromSettings
                : machineProfile.grblHALeepromSettings;
        const inputDefault = get(profileDefaults, settingData.setting, '-');

        if (inputDefault === '-') {
            return true; // default in cases where we don't know the default
        }

        const settingIsNumberValue = !(
            Number.isNaN(inputDefault) || Number.isNaN(inputDefault)
        );

        return settingIsNumberValue
            ? `${Number(settingData.value)}` === `${Number(inputDefault)}`
            : settingData.value === inputDefault;
    }

    function toggleFilterNonDefault() {
        setFilterNonDefault(!filterNonDefault);
    }

    // Populate eeprom descriptions as needed
    useEffect(() => {
        if (!settings.length) {
            return;
        }
        settings.map((ss) => {
            if (!ss || !ss.settings) {
                return;
            }
            ss.settings.map((s) => {
                s.settings.map((o) => {
                    if (o.type == 'eeprom') {
                        const eID = get(o, 'eID', null);
                        if (eID) {
                            let oKey = Number(eID.replace('$', ''));
                            let oEEPROM = get(
                                detectedEEPROMDescriptions,
                                oKey,
                                '',
                            );
                            if (oEEPROM) {
                                o.description = get(oEEPROM, 'details', '');
                                o.label = get(oEEPROM, 'description', '');
                            }
                        }
                    }
                });
            });
        });
    }, [detectedEEPROM, detectedEEPROMDescriptions, detectedEEPROMGroups]);

    const payload = {
        settings,
        EEPROM,
        setEEPROM,
        machineProfile,
        firmwareType: controllerType,
        rawEEPROM,
        setMachineProfile,
        connected,
        settingsAreDirty,
        setSettingsAreDirty,
        searchTerm,
        setSearchTerm,
        settingsValues,
        setSettingsValues,
        settingsFilter,
        toggleFilterNonDefault,
        filterNonDefault,
        eepromIsDefault,
    };

    return (
        <SettingsContext.Provider value={payload}>
            {children}
        </SettingsContext.Provider>
    );
}
