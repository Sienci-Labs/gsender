import { NumberSettingInput } from 'app/features/Config/components/SettingInputs/NumberSettingInput.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';

export interface HybridNumberInputProps {
    unit?: string;
    value: number;
    index: number;
    subIndex: number;
    eepromKey: string;
}

export function HybridNumber({
    unit,
    value,
    eepromKey,
    onChange,
}: HybridNumberInputProps) {
    const { firmwareType, connected, rawEEPROM } = useSettings();

    const useEEPROM = connected && firmwareType === 'GrblHAL';

    function hybridOnChange(v) {}

    // If we're connected and using SLB we use the EEPROM value
    if (useEEPROM) {
        console.log('using EEPROM');
        let eepromValue = rawEEPROM[eepromKey];
        if (eepromValue) {
            value = eepromValue;
        }
    }

    return (
        <NumberSettingInput
            value={value}
            index={0}
            subIndex={0}
            unit={unit}
            onChange={onChange}
        />
    );
}
