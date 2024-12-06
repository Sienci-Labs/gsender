import {
    SettingsMenu,
    SettingsMenuSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import store from 'app/store';
import React, { useEffect, useState } from 'react';
import { isSubSection } from 'app/features/Config/components/Section.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';

import {
    GRBL_SETTINGS,
    GRBL_HAL_SETTINGS,
} from 'app/features/Config/assets/SettingsDescriptions.ts';
import { GRBLHAL } from 'app/constants';
import { getFilteredEEPROMSettings } from 'app/features/Config/utils/EEPROM.ts';
import get from 'lodash/get';

interface iSettingsContext {
    settings: SettingsMenuSection[];
    EEPROM?: object;
    settingsToUpdate?: object;
    EEPROMToUpdate?: object;
    machineProfile: object;
    rawEEPROM: object;
    firmwareType: 'Grbl' | 'GrblHAL';
    setMachineProfile: (o) => {};
    setEEPROM: (state) => {};
    connected: boolean;
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

export function hasSettingsToApply(settings: object, eeprom: object) {
    return Object.keys(settings).length > 0 || Object.keys(eeprom).length > 0;
}

export function applyStoreValues(settings) {}

export function applyEEPROMValues(settings) {}

export function applyNewSettings(settings, eeprom) {}

function populateSettingsValues(settingsSections: SettingsMenuSection[] = []) {
    if (!settingsSections.length) {
        return;
    }
    settingsSections.map((ss) => {
        if (!ss || !ss.settings) {
            return;
        }
        ss.settings.map((s) => {
            if (isSubSection(s)) {
                if (!s.settings) {
                    return;
                }
                s.settings.map((o) => {
                    o.value = fetchStoreValue(o.key);
                });
            } else {
                s.value = fetchStoreValue(s.key);
            }
        });
    });
    return settingsSections;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const [settings, setSettings] =
        useState<SettingsMenuSection[]>(SettingsMenu);
    const [EEPROM, setEEPROM] = useState<object>([]);
    const [rawEEPROM, setRawEEPROM] = useState<object>({});
    const [settingsToUpdate, setSettingsToUpdate] = useState({});
    const [EEPROMToUpdate, setEEPROMToUpdate] = useState({});
    const [machineProfile, setMachineProfile] = useState({});
    const [connected, setConnected] = useState(false);

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

    const handleEEPROMChange = (index) => (value) => {};

    useEffect(() => {
        const machineProfile = store.get('workspace.machineProfile', {});
        setMachineProfile(machineProfile);
    }, []);

    function isDefaultEEPROMValue(key) {
        const machineProfileValue = get(machineProfile, key, null);
        // If we don't find a match, don't highlight
        if (machineProfileValue === null) {
            return true;
        }
    }

    useEffect(() => {
        const populatedSettings = populateSettingsValues(settings);
        setSettings([...populatedSettings]);
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

    const payload = {
        settings,
        settingsToUpdate,
        EEPROMToUpdate,
        EEPROM,
        setEEPROM,
        machineProfile,
        firmwareType: controllerType,
        rawEEPROM,
        setMachineProfile,
        connected,
    };

    return (
        <SettingsContext.Provider value={payload}>
            {children}
        </SettingsContext.Provider>
    );
}
