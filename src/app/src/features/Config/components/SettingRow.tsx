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
import cn from 'classnames';
import { BiReset } from 'react-icons/bi';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import store from 'app/store';
import { FaMicrochip } from 'react-icons/fa6';
import { GRBLHAL } from 'app/constants';
import { JogInput } from 'app/features/Config/components/SettingInputs/JogInput.tsx';
import Tooltip from 'app/components/Tooltip';
import pubsub from 'pubsub-js';
import { EEPROM } from 'app/definitions/firmware';

interface SettingRowProps {
    setting: gSenderSetting;
    index?: number;
    subIndex?: number;
    changeHandler: (v: any) => void;
}

function returnSettingControl(
    _connected: boolean,
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
                    max={setting.max}
                    min={setting.min}
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
                    ip={value as unknown as number[]}
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
                    forceEEPROM={setting.forceEEPROM}
                    onChange={handler}
                    unit={setting.unit}
                />
            );
        case 'event':
            return <EventInput eventType={setting.eventType} />;
        case 'location':
            return (
                <LocationInput
                    value={value as unknown as object}
                    onChange={handler}
                    unit={setting.unit}
                />
            );
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
        case 'jog':
            return (
                <JogInput
                    value={value as unknown as object}
                    index={index}
                    onChange={handler}
                />
            );
        default:
            return setting.type;
    }
}

export function SettingRow({
    setting,
    changeHandler,
}: SettingRowProps): JSX.Element {
    const {
        settingsValues,
        setSettingsAreDirty,
        setEEPROM,
        setSettingsValues,
        firmwareType,
        connected,
        isSettingDefault,
        getEEPROMDefaultValue,
    } = useSettings();

    const displaySetting = { ...setting };
    // Default function to not hidden
    let isHidden = false;
    if (setting && setting.hidden) {
        isHidden = setting.hidden();
    }

    const handleSettingsChange = (index: number) => (value: any) => {
        setSettingsAreDirty(true);
        setEEPROM((prev) => {
            console.log(prev);
            const updated = [...prev];
            // save the value from before we started editing
            if (!updated[index].ogValue) {
                updated[index].ogValue = updated[index].value;
            }
            updated[index].value = value;
            updated[index].dirty = true;
            return updated;
        });
    };

    function handleSingleSettingReset(setting: EEPROM, value: string | number) {
        setEEPROM((prev) => {
            const updated = [...prev];
            const eeprom =
                updated[updated.findIndex((val) => val.setting === setting)];
            // if the value is edited, but the original value that was saved is equal to the default value,
            // we know that the eeprom in the firmware = default,
            // so we can safely set it to the default here.
            // we need to do this, because if the firmware value hasnt changed from default,
            // then resetting it will NOT trigger a redux update,
            // which means the config input will not update to show the default value -
            // it will stay as the edited value.
            if (eeprom.dirty && eeprom.ogValue === value) {
                eeprom.value = value;
                eeprom.ogValue = null;
            }
            eeprom.dirty = false;
            return updated;
        });
        controller.command('gcode', [`${setting}=${value}`, '$$']);
        toast.success(`Restored ${setting} to default value of ${value}`, {
            position: 'bottom-right',
        });
    }

    function handleProgramSettingReset(setting: gSenderSetting) {
        if (setting.type === 'hybrid' && firmwareType === GRBLHAL) {
            const defaultVal = getEEPROMDefaultValue(setting.eID);
            if (defaultVal !== '-') {
                handleSingleSettingReset(setting.eID, defaultVal);
                // since hybrids are sometimes referenced using the settings values, we have to update that as well
                store.set(setting.key, defaultVal);
                setSettingsValues((prev) => {
                    const updated = [...prev];
                    updated[setting.globalIndex].value = defaultVal;
                    updated[setting.globalIndex].dirty = false;
                    return updated;
                });
            } else {
                toast.error(`No default found for $${setting.eID}.`);
            }
        }
        if ('key' in setting) {
            if (setting.defaultValue !== null) {
                store.set(setting.key, setting.defaultValue);
                setSettingsValues((prev) => {
                    const updated = [...prev];
                    updated[setting.globalIndex].value = setting.defaultValue;
                    updated[setting.globalIndex].dirty = false;
                    return updated;
                });
            }
        }
        pubsub.publish('programSettingReset', setting.key);
    }

    const populatedValue = settingsValues[setting.globalIndex] || {
        type: 'text',
    };

    // if EEPROM or Hybrid and not connected, show nothing
    if (
        (setting.type === 'eeprom' || setting.type === 'hybrid') &&
        !connected
    ) {
        return <></>;
    }

    if (connected && setting.type === 'eeprom') {
        const idToUse = setting.remap ? setting.remap : setting.eID;
        return (
            <EEPROMSettingRow
                eID={idToUse}
                changeHandler={handleSettingsChange}
                resetHandler={handleSingleSettingReset}
                linkLabel={setting.toolLink}
                link={setting.toolLinkLabel}
            />
        );
    }

    const isDefault = isSettingDefault(populatedValue);

    return (
        <div
            className={cn(
                'p-2 flex flex-row flex-wrap items-center text-gray-700 border-b border-gray-200',
                {
                    hidden: isHidden,
                    'odd:bg-yellow-50 even:bg-yellow-50 dark:bg-blue-900 dark:text-white':
                        !isDefault,
                },
            )}
        >
            <span className="w-full sm:w-1/5 font-xl sm:mb-0 mb-2 dark:text-gray-400 flex items-center justify-between sm:block ">
                <span>{setting.label}</span>
                <span className="sm:hidden flex flex-row gap-2">
                    {!isDefault && (
                        <Tooltip content="Reset to default value">
                            <button
                                className="text-3xl"
                                title=""
                                onClick={() => {
                                    Confirm({
                                        title: 'Reset setting',
                                        content:
                                            'Are you sure you want to reset this value to default?',
                                        confirmLabel: 'Yes',
                                        onConfirm: () => {
                                            handleProgramSettingReset(
                                                populatedValue,
                                            );
                                        },
                                    });
                                }}
                            >
                                <BiReset />
                            </button>
                        </Tooltip>
                    )}
                    {setting.type === 'hybrid' && firmwareType === GRBLHAL ? (
                        <Tooltip content="Machine setting">
                            <span className="text-robin-500 text-4xl">
                                <FaMicrochip />
                            </span>
                        </Tooltip>
                    ) : (
                        <span className="text-robin-500 min-w-9" />
                    )}
                </span>
            </span>
            <span className="w-full sm:w-2/5 order-2 sm:order-3 text-gray-500 text-sm flex flex-col gap-2 max-sm:mb-4 mb-2">
                {setting.description.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </span>
            <span className="w-full sm:w-1/5 sm:order-none order-3 text-xs px-4 dark:text-gray-200 sm:mb-0  max-sm:mb-2 mb-0">
                {returnSettingControl(
                    connected,
                    displaySetting,
                    populatedValue.value,
                    setting.globalIndex,
                    changeHandler(populatedValue.globalIndex),
                )}
            </span>
            <span className="hidden sm:flex w-1/5 text-xs px-4 flex-row gap-2 justify-end">
                {!isDefault && (
                    <Tooltip content="Reset to default value">
                        <button
                            className="text-3xl"
                            title=""
                            onClick={() => {
                                Confirm({
                                    title: 'Reset setting',
                                    content:
                                        'Are you sure you want to reset this value to default?',
                                    confirmLabel: 'Yes',
                                    onConfirm: () => {
                                        handleProgramSettingReset(
                                            populatedValue,
                                        );
                                    },
                                });
                            }}
                        >
                            <BiReset />
                        </button>
                    </Tooltip>
                )}
                {setting.type === 'hybrid' && firmwareType === GRBLHAL ? (
                    <Tooltip content="Machine setting">
                        <span className="text-robin-500 text-4xl">
                            <FaMicrochip />
                        </span>
                    </Tooltip>
                ) : (
                    <span className="text-robin-500 min-w-9" />
                )}
            </span>
        </div>
    );
}
