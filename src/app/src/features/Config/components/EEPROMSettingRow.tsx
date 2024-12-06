import { gSenderEEPROMSetting } from 'app/features/Config/assets/SettingsMenu.ts';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { getDatatypeInput } from 'app/features/Config/utils/EEPROM.ts';
import get from 'lodash/get';
import { BiReset } from 'react-icons/bi';

interface EEPROMSettingRowProps {
    eID: string;
    index: number;
}

function filterNewlines(data = '') {
    if (!data) {
        return '';
    }
    return data.replace(/\\n/gim, '\n');
}

export function EEPROMSettingRow({ eID, index }: EEPROMSettingRowProps) {
    const { EEPROM, machineProfile, firmwareType } = useSettings();
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
        const isDefault = `${EEPROMData.value}` === `${inputDefault}`;
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
                key={`${EEPROMData.key}`}
                className="odd:bg-robin-100 even:bg-robin-50 p-2 flex flex-row items-center"
            >
                <span className="w-1/5 text-gray-700">
                    {EEPROMData.description}
                </span>
                <span className="w-1/5 text-xs px-4">
                    <InputElement
                        info={EEPROMData}
                        setting={EEPROMData}
                        onChange={() => {}}
                    />
                </span>
                <span className="w-1/5 text-xs px-4">
                    {!isDefault && (
                        <button className="text-3xl" title="Reset Default">
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
