import { gSenderEEEPROMSettings } from 'app/features/Config/assets/SettingsMenu.ts';

export function isEEPROMSettingsSection(s: gSenderEEEPROMSettings): boolean {
    return 'label' in s && 'eeprom' in s;
}

export function EEPROMSection() {
    return (
        <div className="w-[95%] m-auto border border-solid border-gray-300 p-4 rounded bg-opacity-60 bg-gradient-to-b from-[#cbd5e1] 20% to-[#e5e7eb] 100%">
            EEPROM yo
        </div>
    );
}
