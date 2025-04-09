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
    GRBL_SETTINGS,
    GRBL_HAL_SETTINGS,
} from 'app/features/Config/assets/SettingsDescriptions.ts';
import { GRBLHAL } from 'app/constants';
import { getFilteredEEPROMSettings } from 'app/features/Config/utils/EEPROM.ts';
import get from 'lodash/get';
import defaultStoreState from 'app/store/defaultState';

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
                if (o.key.length > 0) {
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
        const machineProfile = store.get('workspace.machineProfile', {});
        setMachineProfile(machineProfile);
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
        }

        if (searchTerm.length === 0 || !searchTerm) {
            return true;
        }
        return JSON.stringify(v)
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
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
    };

    return (
        <SettingsContext.Provider value={payload}>
            {children}
        </SettingsContext.Provider>
    );
}
