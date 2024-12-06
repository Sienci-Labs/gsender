import React from 'react';
import { gSenderSetting } from 'app/features/Config/assets/SettingsMenu.ts';
import { BooleanSettingInput } from 'app/features/Config/components/SettingInputs/BooleanSettingInput.tsx';
import { SelectSettingInput } from 'app/features/Config/components/SettingInputs/SelectSettingInput.tsx';
import { NumberSettingInput } from 'app/features/Config/components/SettingInputs/NumberSettingInput.tsx';
import { RadioSettingInput } from 'app/features/Config/components/SettingInputs/RadioSettingInput.tsx';
import { IPSettingInput } from 'app/features/Config/components/SettingInputs/IP.tsx';
import { HybridNumber } from 'app/features/Config/components/SettingInputs/HybridNumber.tsx';

interface SettingRowProps {
    setting: gSenderSetting;
    index?: number;
    subIndex?: number;
}

function returnSettingControl(
    setting: gSenderSetting,
    index: number = -1,
    subIndex: number = -1,
) {
    switch (setting.type) {
        case 'boolean':
            return (
                <BooleanSettingInput
                    value={setting.value as boolean}
                    index={index}
                    subIndex={subIndex}
                />
            );
        case 'select':
            return (
                <SelectSettingInput
                    options={setting.options}
                    index={index}
                    subIndex={subIndex}
                    value={setting.value as string}
                />
            );
        case 'number':
            return (
                <NumberSettingInput
                    unit={setting.unit}
                    value={setting.value as number}
                    index={index}
                    subIndex={subIndex}
                />
            );
        case 'radio':
            return (
                <RadioSettingInput
                    options={setting.options}
                    index={index}
                    subIndex={subIndex}
                    value={setting.value as string}
                />
            );
        case 'ip':
            return (
                <IPSettingInput
                    ip={setting.value as number[]}
                    index={index}
                    subIndex={subIndex}
                />
            );
        case 'hybrid':
            return (
                <HybridNumber
                    value={setting.value as number}
                    index={index}
                    subIndex={subIndex}
                    eepromKey={setting.eID}
                />
            );
        default:
            return setting.type;
    }
}

export function SettingRow({ setting, index }: SettingRowProps): JSX.Element {
    return (
        <div className="odd:bg-gray-100 even:bg-white p-2 flex flex-row items-center">
            <span className="w-1/5">{setting.label}</span>
            <span className="w-1/5 text-xs px-4">
                {returnSettingControl(setting, index)}
            </span>
            <span></span>
            <span className="text-gray-500 text-sm w-2/5">
                {setting.description}
            </span>
        </div>
    );
}
