import React from 'react';
import {
    gSenderSetting,
    gSenderSettingsValues,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { BooleanSettingInput } from 'app/features/Config/components/SettingInputs/BooleanSettingInput.tsx';
import { SelectSettingInput } from 'app/features/Config/components/SettingInputs/SelectSettingInput.tsx';
import { NumberSettingInput } from 'app/features/Config/components/SettingInputs/NumberSettingInput.tsx';
import { RadioSettingInput } from 'app/features/Config/components/SettingInputs/RadioSettingInput.tsx';
import { IPSettingInput } from 'app/features/Config/components/SettingInputs/IP.tsx';
import { HybridNumber } from 'app/features/Config/components/SettingInputs/HybridNumber.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { EEPROMSettingRow } from 'app/features/Config/components/EEPROMSettingRow.tsx';

interface SettingRowProps {
    setting: gSenderSetting;
    index?: number;
    subIndex?: number;
    changeHandler: (v) => void;
}

function returnSettingControl(
    setting: gSenderSetting,
    value: gSenderSettingsValues = 0,
    index: number = -1,
    handler,
) {
    switch (setting.type) {
        case 'boolean':
            return (
                <BooleanSettingInput
                    value={value as boolean}
                    index={index}
                    onChange={handler}
                />
            );
        case 'select':
            return (
                <SelectSettingInput
                    options={setting.options}
                    index={index}
                    value={value as string}
                    onChange={handler}
                />
            );
        case 'number':
            return (
                <NumberSettingInput
                    unit={setting.unit}
                    value={value as number}
                    index={index}
                    onChange={handler}
                />
            );
        case 'radio':
            return (
                <RadioSettingInput
                    options={setting.options}
                    index={index}
                    value={value as string}
                    onChange={handler}
                />
            );
        case 'ip':
            return (
                <IPSettingInput
                    ip={value as number[]}
                    index={index}
                    onChange={handler}
                />
            );
        case 'hybrid':
            return (
                <HybridNumber
                    value={value as number}
                    index={index}
                    eepromKey={setting.eID}
                    onChange={handler}
                />
            );
        default:
            return setting.type;
    }
}

export function SettingRow({
    setting,
    index,
    changeHandler,
}: SettingRowProps): JSX.Element {
    const { settingsValues } = useSettings();
    const connected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const populatedValue = settingsValues[setting.globalIndex] || {};
    // if EEPROM or Hybrid and not connected, show nothing
    if (
        (setting.type === 'eeprom' || setting.type === 'hybrid') &&
        !connected
    ) {
        return <div>Hidden</div>;
    }

    if (connected && setting.type === 'eeprom') {
        return (
            <EEPROMSettingRow
                eID={setting.eID}
                changeHandler={() => {}}
                resetHandler={() => {}}
            />
        );
    }

    return (
        <div className="odd:bg-gray-100 even:bg-white p-2 flex flex-row items-center text-gray-700">
            <span className="w-1/5">{setting.label}</span>
            <span className="w-1/5 text-xs px-4">
                {returnSettingControl(
                    setting,
                    populatedValue.value,
                    setting.globalIndex,
                    changeHandler(populatedValue.globalIndex),
                )}
            </span>
            <span></span>
            <span className="text-gray-500 text-sm w-2/5">
                {setting.description}
            </span>
        </div>
    );
}
