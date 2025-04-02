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
import { EEPROMSettingRow } from 'app/features/Config/components/EEPROMSettingRow.tsx';
import { EventInput } from 'app/features/Config/components/SettingInputs/EventInput.tsx';
import controller from 'app/lib/controller.ts';
import { toast } from 'app/lib/toaster';
import { TextAreaInput } from 'app/features/Config/components/SettingInputs/TextAreaInput.tsx';
import { LocationInput } from 'app/features/Config/components/SettingInputs/LocationInput.tsx';
import get from 'lodash/get';
import cn from 'classnames';

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
                    disabled={setting.disabled}
                />
            );
        case 'select':
            return (
                <SelectSettingInput
                    options={setting.options}
                    index={index}
                    value={value as string}
                    onChange={handler}
                    disabled={setting.disabled}
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
        case 'event':
            return <EventInput eventType={setting.eventType} />;
        case 'location':
            return <LocationInput value={value as object} onChange={handler} />;
        case 'textarea':
            return (
                <TextAreaInput
                    value={value as string}
                    index={index}
                    onChange={handler}
                />
            );
        case 'wizard':
            return setting.wizard();
        default:
            return setting.type;
    }
}

export function SettingRow({
    setting,
    index,
    changeHandler,
}: SettingRowProps): JSX.Element {
    const { settingsValues, setSettingsAreDirty, setEEPROM, connected } =
        useSettings();

    // Default function to not hidden
    let isHidden = false;
    if (setting && setting.hidden) {
        isHidden = setting.hidden();
    }

    const handleSettingsChange = (index) => (value) => {
        setSettingsAreDirty(true);
        setEEPROM((prev) => {
            const updated = [...prev];
            updated[index].value = value;
            updated[index].dirty = true;
            return updated;
        });
    };

    function handleSingleSettingReset(setting, value) {
        controller.command('gcode', [`${setting}=${value}`, '$$']);
        toast.success(`Restored ${setting} to default value of ${value}`);
    }

    const populatedValue = settingsValues[setting.globalIndex] || {};
    // if EEPROM or Hybrid and not connected, show nothing
    if (
        (setting.type === 'eeprom' || setting.type === 'hybrid') &&
        !connected
    ) {
        return <></>;
    }

    if (connected && setting.type === 'eeprom') {
        return (
            <EEPROMSettingRow
                eID={setting.eID}
                changeHandler={handleSettingsChange}
                resetHandler={handleSingleSettingReset}
                linkLabel={setting.toolLink}
                link={setting.toolLinkLabel}
            />
        );
    }
    //const newLineDesc = setting.description.replace(/\n/g, '<br />')
    return (
        <div
            className={cn('p-2 flex flex-row items-center text-gray-700', {
                hidden: isHidden,
            })}
        >
            <span className="w-1/5 dark:text-gray-400">{setting.label}</span>
            <span className="w-1/5 text-xs px-4 dark:text-gray-200">
                {returnSettingControl(
                    setting,
                    populatedValue.value,
                    setting.globalIndex,
                    changeHandler(populatedValue.globalIndex),
                )}
            </span>
            <span className="w-1/5 text-xs px-4"></span>
            <span className="text-gray-500 text-sm w-2/5 flex flex-col gap-2">
                {setting.description.split('\n').map((line, index) => (
                    <p>{line}</p>
                ))}
            </span>
        </div>
    );
}
