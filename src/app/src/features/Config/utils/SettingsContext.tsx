import {
    SettingsMenu,
    SettingsMenuSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import store from 'app/store';
import React, { useEffect, useState } from 'react';
import { isSubSection } from 'app/features/Config/components/Section.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';

interface iSettingsContext {
    settings: SettingsMenuSection[];
    EEPROM?: object;
    settingsToUpdate?: object;
    EEPROMToUpdate?: object;
}

interface SettingsProviderProps {
    children: React.ReactNode;
}

const defaultState = {
    settings: SettingsMenu,
    settingsToUpdate: {},
    EEPROMToUpdate: {},
    EEPROM: {},
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
    const [EEPROM, setEEPROM] = useState<object>({});
    const [settingsToUpdate, setSettingsToUpdate] = useState({});
    const [EEPROMToUpdate, setEEPROMToUpdate] = useState({});

    const detectedEEPROM = useSelector(
        (state: RootState) => state.controller.settings.settings,
    );

    useEffect(() => {
        const populatedSettings = populateSettingsValues(settings);
        setSettings([...populatedSettings]);
        setEEPROM(detectedEEPROM);
    }, [detectedEEPROM]);

    const payload = {
        settings,
        settingsToUpdate,
        EEPROMToUpdate,
        EEPROM,
    };

    return (
        <SettingsContext.Provider value={payload}>
            {children}
        </SettingsContext.Provider>
    );
}
