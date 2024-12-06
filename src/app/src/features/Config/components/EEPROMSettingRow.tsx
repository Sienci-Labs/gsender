import { gSenderEEPROMSetting } from 'app/features/Config/assets/SettingsMenu.ts';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { getDatatypeInput } from 'app/features/Config/utils/EEPROM.ts';
import get from 'lodash/get';
import { BiReset } from 'react-icons/bi';
import cn from 'classnames';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import { matchesSearchTerm } from 'app/features/Config/utils/Settings.ts';

interface EEPROMSettingRowProps {
    eID: string;
    index: number;
    changeHandler: (value: number) => void;
    resetHandler: (k, v) => void;
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
}: EEPROMSettingRowProps) {
    const {
        EEPROM,
        machineProfile,
        firmwareType,
        searchTerm,
        setSettingsAreDirty,
    } = useSettings();
    if (!EEPROM) {
        return;
    }
    const EEPROMData = EEPROM.find((s) => s.setting === eID);
    if (EEPROMData) {
        const profileDefaults =
            firmwareType === 'Grbl'
                ? machineProfile.eepromSettings
                : machineProfile.grblHALeepromSettings;

        const InputElement = getDatatypeInput(
            EEPROMData.dataType,
            firmwareType,
        );

        const inputDefault = get(profileDefaults, eID, '-');
        const settingIsNumberValue = !(
            Number.isNaN(inputDefault) || Number.isNaN(inputDefault)
        );

        const isDefault = settingIsNumberValue
            ? `${Number(EEPROMData.value)}` === `${Number(inputDefault)}`
            : EEPROMData.value === inputDefault;

        const matchesSearch = matchesSearchTerm(EEPROMData, searchTerm);

        const detailString = (
            <span>
                <b>{EEPROMData.setting}</b>
                <span> - </span>
                {filterNewlines(EEPROMData.details)}
                <br />
                <i>Default {inputDefault}</i>
            </span>
        );

        return (
            <div
                key={`eSetting-${EEPROMData.key}`}
                className={cn(
                    'odd:bg-robin-100 even:bg-robin-50 p-2 flex flex-row items-center',
                    {
                        'odd:bg-yellow-50 even:bg-yellow-50 ': !isDefault,
                    },
                    {
                        hidden: !matchesSearch,
                    },
                )}
            >
                <span className="w-1/5 text-gray-700">
                    {EEPROMData.description}
                </span>
                <div
                    className="w-1/5 text-xs px-4"
                    key={`input-${EEPROMData.key}`}
                >
                    <InputElement
                        info={EEPROMData}
                        setting={EEPROMData}
                        onChange={changeHandler(EEPROMData.globalIndex)}
                    />
                </div>
                <span className="w-1/5 text-xs px-4">
                    {!isDefault && (
                        <button
                            className="text-3xl"
                            title="Reset Default"
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
                    )}
                </span>
                <span className="text-gray-500 text-sm w-2/5">
                    {detailString}
                </span>
            </div>
        );
    }
    return <></>;
}
