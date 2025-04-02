import { gSenderEEPROMSetting } from 'app/features/Config/assets/SettingsMenu.ts';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { getDatatypeInput } from 'app/features/Config/utils/EEPROM.ts';
import get from 'lodash/get';
import { BiReset } from 'react-icons/bi';
import cn from 'classnames';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import { matchesSearchTerm } from 'app/features/Config/utils/Settings.ts';
import { FaMicrochip } from 'react-icons/fa6';
import { ToolLink } from 'app/features/Config/components/wizards/SquaringToolWizard.tsx';

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
                    'p-2 flex flex-row items-center',
                    {
                        'odd:bg-yellow-50 even:bg-yellow-50 dark:bg-blue-900 dark:text-white': !isDefault,
                    },
                    {
                        hidden: !matchesSearch,
                    },
                )}
            >
                <div className="w-1/5 text-gray-700 flex flex-row gap-2 items-center relative dark:text-gray-400">
                    {EEPROMData.description}
                </div>
                <div
                    className="w-1/5 text-xs px-4 gap-2 flex flex-col"
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
                <span className="w-1/5 text-xs px-4 flex flex-row gap-2 justify-end">
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
                    <span className="text-robin-500 text-4xl">
                        <FaMicrochip />
                    </span>
                </span>
                <span className="text-gray-500 text-sm w-2/5">
                    {detailString}
                </span>
            </div>
        );
    }
    return <></>;
}
