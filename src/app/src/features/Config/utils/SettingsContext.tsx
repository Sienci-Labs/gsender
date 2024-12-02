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

interface iSettingsContext {
    settings: SettingsMenuSection[];
    EEPROM?: object;
    settingsToUpdate?: object;
    EEPROMToUpdate?: object;
    machineProfile: object;
    firmwareType: 'Grbl' | 'GrblHAL';
}

interface SettingsProviderProps {
    children: React.ReactNode;
}

const defaultState = {
    settings: SettingsMenu,
    settingsToUpdate: {},
    EEPROMToUpdate: {},
    EEPROM: {},
    machineProfile: {},
    firmwareType: 'Grbl',
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
    const [settingsToUpdate, setSettingsToUpdate] = useState({});
    const [EEPROMToUpdate, setEEPROMToUpdate] = useState({});
    const [machineProfile, setMachineProfile] = useState({});

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

    const BASE_SETTINGS =
        controllerType === GRBLHAL ? GRBL_HAL_SETTINGS : GRBL_SETTINGS;

    useEffect(() => {
        const machineProfile = store.get('workspace.machineProfile', {});
        console.log(machineProfile);
        setMachineProfile(machineProfile);
    }, []);

    useEffect(() => {
        const populatedSettings = populateSettingsValues(settings);
        setSettings([...populatedSettings]);
    }, [detectedEEPROM]);

    useEffect(() => {
        setEEPROM(
            getFilteredEEPROMSettings(
                BASE_SETTINGS,
                detectedEEPROM,
                detectedEEPROMDescriptions,
                detectedEEPROMGroups,
            ),
        );
        console.log(EEPROM);
    }, [detectedEEPROM, detectedEEPROMDescriptions, detectedEEPROMGroups]);

    const payload = {
        settings,
        settingsToUpdate,
        EEPROMToUpdate,
        EEPROM,
        machineProfile,
        firmwareType: controllerType,
    };

    return (
        <SettingsContext.Provider value={payload}>
            {children}
        </SettingsContext.Provider>
    );
}
