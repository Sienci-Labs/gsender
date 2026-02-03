import { NumberSettingInput } from 'app/features/Config/components/SettingInputs/NumberSettingInput.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';

export interface HybridNumberInputProps {
    unit?: string;
    value: number;
    index: number;
    subIndex?: number;
    eepromKey: string;
    forceEEPROM?: boolean;
    onChange?: (v: any) => void;
}

export function HybridNumber({
    unit,
    value,
    eepromKey,
    onChange,
    forceEEPROM = false,
}: HybridNumberInputProps) {
    const { firmwareType, connected, EEPROM, setEEPROM, setSettingsAreDirty } =
        useSettings();
    const [eepromObject, setEEPROMObject] = useState({});

    const useEEPROM =
        (connected && firmwareType === 'grblHAL') || (connected && forceEEPROM);

    useEffect(() => {
        let eepromValue = EEPROM.filter((o) => o.setting === eepromKey)[0];
        if (eepromValue && useEEPROM) {
            value = Number(eepromValue.value);
            setEEPROMObject(eepromValue);
        }
    }, [EEPROM]);

    function hybridOnChange(v) {
        // if it's empty, then the value isnt reported in eeprom. so dont try to change the eeprom
        if (useEEPROM && !isEmpty(eepromObject)) {
            let payload = { ...eepromObject, value: v, dirty: true };
            setEEPROM((prev) => {
                const updated = [...prev];
                // save the value from before we started editing
                if (!payload.ogValue) {
                    payload.ogValue = prev[payload.globalIndex].value;
                }
                updated[payload.globalIndex] = payload;
                return updated;
            });
            setSettingsAreDirty(true);
        }
        // since hybrids are always referencing the settings values, we always have to update that as well
        onChange(v);
    }

    // If we're connected and using SLB we use the EEPROM value
    if (useEEPROM && !isEmpty(eepromObject)) {
        value = eepromObject.value;
    }

    return (
        <NumberSettingInput
            value={value}
            index={0}
            subIndex={0}
            unit={unit}
            onChange={hybridOnChange}
        />
    );
}
