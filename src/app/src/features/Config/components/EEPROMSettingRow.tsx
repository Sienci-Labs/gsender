import { gSenderEEPROMSetting } from 'app/features/Config/assets/SettingsMenu.ts';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { getDatatypeInput } from 'app/features/Config/utils/EEPROM.ts';
import get from 'lodash/get';
import { BiReset } from 'react-icons/bi';
import cn from 'classnames';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import { FaMicrochip } from 'react-icons/fa6';
import { ToolLink } from 'app/features/Config/components/wizards/SquaringToolWizard.tsx';
import Tooltip from 'app/components/Tooltip';

interface EEPROMSettingRowProps {
    eID: string;
    changeHandler: (value: number) => void;
    resetHandler: (k, v) => void;
    link?: string;
    linkLabel?: string;
}

function filterNewlines(data = '') {
    if (!data) {
        return '';
    }
    return data.replace(/\\n/gim, '\n');
}

export function EEPROMSettingRow({
    eID,
    changeHandler,
    resetHandler,
    link = null,
    linkLabel = null,
}: EEPROMSettingRowProps) {
    const { EEPROM, machineProfile, firmwareType, eepromIsDefault } =
        useSettings();
    if (!EEPROM) {
        return;
    }

    const EEPROMData = EEPROM.find((s) => s.setting === eID);

    if (EEPROMData) {
        const isDefault = eepromIsDefault(EEPROMData);
        const profileDefaults =
            firmwareType === 'Grbl'
                ? machineProfile.eepromSettings
                : machineProfile.grblHALeepromSettings;

        const InputElement = getDatatypeInput(
            EEPROMData.dataType,
            firmwareType,
        );

        const inputDefault = get(profileDefaults, eID, '-');

        //const matchesSearch = matchesSearchTerm(EEPROMData, searchTerm);

        const detailString = (
            <span>
                {filterNewlines(EEPROMData.details)}
                <span>
                    {' '}
                    ({EEPROMData.setting}, Default {inputDefault})
                </span>
            </span>
        );

        return (
            <div
                key={`eSetting-${EEPROMData.key}`}
                className={cn(
                    'p-2 flex flex-row flex-wrap items-center border-b border-gray-200',
                    {
                        'odd:bg-yellow-50 even:bg-yellow-50 dark:bg-blue-900 dark:text-white':
                            !isDefault,
                    },
                )}
            >
                <div className="w-full sm:w-1/5 flex flex-row gap-2 items-center justify-between sm:justify-start text-gray-700 relative dark:text-gray-400 mb-2 sm:mb-0">
                    <span>{EEPROMData.description}</span>
                    <span className="flex flex-row gap-2 sm:hidden">
                        {!isDefault && (
                            <Tooltip content="Reset to default value">
                                <button
                                    className="text-3xl"
                                    onClick={() => {
                                        Confirm({
                                            title: 'Reset Single EEPROM Value',
                                            content:
                                                'Are you sure you want to reset this value to default?',
                                            confirmLabel: 'Yes',
                                            onConfirm: () => {
                                                resetHandler(
                                                    EEPROMData.setting,
                                                    inputDefault,
                                                );
                                            },
                                        });
                                    }}
                                >
                                    <BiReset />
                                </button>
                            </Tooltip>
                        )}
                        <Tooltip content="Machine setting">
                            <span className="text-robin-500 text-4xl">
                                <FaMicrochip />
                            </span>
                        </Tooltip>
                    </span>
                </div>
                <span className="w-full sm:w-2/5 text-gray-500 text-sm mb-2 max-sm:mb-4 sm:order-none order-1">
                    {detailString}
                </span>
                <div
                    className="w-full sm:w-1/5 text-xs px-4 gap-2 flex flex-col mb-0 sm:mb-0 max-sm:mb-2 sm:order-none order-2"
                    key={`input-${EEPROMData.key}`}
                >
                    <InputElement
                        info={EEPROMData}
                        setting={EEPROMData}
                        onChange={changeHandler(EEPROMData.globalIndex)}
                    />
                    {link && (
                        <div>
                            <ToolLink link={link} label={linkLabel} />
                        </div>
                    )}
                </div>
                <span className="hidden sm:flex w-1/5 text-xs px-4 flex-row gap-2 justify-end">
                    {!isDefault && (
                        <Tooltip content="Reset to default value">
                            <button
                                className="text-3xl"
                                onClick={() => {
                                    Confirm({
                                        title: 'Reset Single EEPROM Value',
                                        content:
                                            'Are you sure you want to reset this value to default?',
                                        confirmLabel: 'Yes',
                                        onConfirm: () => {
                                            resetHandler(
                                                EEPROMData.setting,
                                                inputDefault,
                                            );
                                        },
                                    });
                                }}
                            >
                                <BiReset />
                            </button>
                        </Tooltip>
                    )}
                    <Tooltip content="Machine setting">
                        <span className="text-robin-500 text-4xl">
                            <FaMicrochip />
                        </span>
                    </Tooltip>
                </span>
            </div>
        );
    }
}
