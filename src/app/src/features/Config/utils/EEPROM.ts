import get from 'lodash/get';
import BooleanInput from 'app/features/Config/components/EEPROMInputs/BooleanInput.tsx';
import BitfieldInput from 'app/features/Config/components/EEPROMInputs/BitfieldInput.tsx';
import ExclusiveBitfieldInput from 'app/features/Config/components/EEPROMInputs/ExclusiveBitfieldInput.tsx';
import RadioButtonInput from 'app/features/Config/components/EEPROMInputs/RadioButtonInput.tsx';
import AxisMaskInput from 'app/features/Config/components/EEPROMInputs/AxisMaskInput.tsx';
import IntegerInput from 'app/features/Config/components/EEPROMInputs/IntegerInput.tsx';
import DecimalInput from 'app/features/Config/components/EEPROMInputs/DecimalInput.tsx';
import StringInput from 'app/features/Config/components/EEPROMInputs/StringInput.tsx';
import PasswordInput from 'app/features/Config/components/EEPROMInputs/PasswordInput.tsx';
import Ipv4Input from 'app/features/Config/components/EEPROMInputs/Ipv4Input.tsx';
import { toast } from 'app/lib/toaster';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
export const BOOLEAN_ID = 0;
export const BITFIELD_ID = 1;
export const EXCLUSIVE_BITFIELD_ID = 2;
export const RADIO_BUTTON_ID = 3;
export const AXIS_MASK_ID = 4;
export const INTEGER_ID = 5;
export const DECIMAL_ID = 6;
export const STRING_ID = 7;
export const PASSWORD_ID = 8;
export const IPV4_ID = 9;

export function getFilteredEEPROMSettings(
    settings,
    eeprom,
    halDescriptions,
    halGroups,
) {
    return Object.keys(eeprom).map((setting, index) => {
        const properties = settings.find((obj) => obj.setting === setting);
        const eKey = setting.replace('$', '');
        const halData = get(halDescriptions, `${eKey}`, {
            group: -1,
        });
        const halGroup = get(halGroups, `${halData.group}.label`, '');

        return {
            ...(properties || {}),
            globalIndex: index,
            setting,
            value: eeprom[setting],
            ...halData,
            group: halGroup,
            groupID: halData.group,
        };
    });
}

export const importFirmwareSettings = (file, callback) => {
    const reader = new FileReader();

    reader.onload = callback;
    reader.readAsText(file);
};

export const halDatatypeMap = {
    [BOOLEAN_ID]: BooleanInput,
    [BITFIELD_ID]: BitfieldInput,
    [EXCLUSIVE_BITFIELD_ID]: ExclusiveBitfieldInput,
    [RADIO_BUTTON_ID]: RadioButtonInput,
    [AXIS_MASK_ID]: AxisMaskInput,
    [INTEGER_ID]: IntegerInput,
    [DECIMAL_ID]: DecimalInput,
    [STRING_ID]: StringInput,
    [PASSWORD_ID]: PasswordInput,
    [IPV4_ID]: Ipv4Input,
};

export const getDatatypeInput = (type, firmware) => {
    // Translate the old values to new
    type = Number(type);
    return halDatatypeMap[type] || String;
};

export function generateEEPROMSettings(eeprom) {
    const toChange = {};
    eeprom.map((setting) => {
        if (setting.dirty) {
            toChange[setting.setting] = setting.value;
            setting.dirty = false;
        }
    });
    return toChange;
}
