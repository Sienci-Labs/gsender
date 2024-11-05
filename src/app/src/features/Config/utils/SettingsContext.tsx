import {
    SettingsMenu,
    SettingsMenuSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import store from 'app/store';
import React, { useEffect, useState } from 'react';
import { isSubSection } from 'app/features/Config/components/Section.tsx';

interface iSettingsContext {
    settings: SettingsMenuSection[];
    EEPROM?: number[];
}

interface SettingsProviderProps {
    children: React.ReactNode;
}

const defaultState = {
    settings: SettingsMenu,
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

    useEffect(() => {
        setSettings(populateSettingsValues(settings));
        console.log(settings);
    }, []);

    return (
        <SettingsContext.Provider value={{ settings }}>
            {children}
        </SettingsContext.Provider>
    );
}
