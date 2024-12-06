import {
    gSenderEEEPROMSettings,
    gSenderEEPROMSetting,
    gSenderEEPROMSettingSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { EEPROMNotConnectedWarning } from 'app/features/Config/components/EEPROMNotConnectedWarning.tsx';
import { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import { BiReset } from 'react-icons/bi';
import { getDatatypeInput } from 'app/features/Config/utils/EEPROM.ts';
import { EEPROMSettingRow } from 'app/features/Config/components/EEPROMSettingRow.tsx';

export function isEEPROMSettingsSection(s: gSenderEEEPROMSettings): boolean {
    return 'label' in s && 'eeprom' in s;
}

export interface EEPROMSectionProps {
    label: string;
    settings?: gSenderEEEPROMSettings;
}

/*export function EEPROMSettingRow(setting: gSenderEEPROMSetting, index: number) {
    const { EEPROM, machineProfile, firmwareType } = useSettings();
    if (!EEPROM) {
        return;
    }
    const EEPROMData = EEPROM.find((s) => s.setting === setting.eId);
    if (EEPROMData) {
        const profileDefaults =
            firmwareType === 'Grbl'
                ? machineProfile.eepromSettings
                : machineProfile.grblHALeepromSettings;

        const InputElement = getDatatypeInput(
            EEPROMData.dataType,
            firmwareType,
        );

        const inputDefault = get(profileDefaults, setting.eId, '-');
        const isDefault = `${setting.value}` === `${inputDefault}`;
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
}*/

export function EEPROMSection({
    label,
    settings = [],
}: EEPROMSectionProps): JSX.Element {
    const { EEPROM } = useSettings();
    const connected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    if (!connected) {
        return <EEPROMNotConnectedWarning />;
    }

    return (
        <>
            {settings.map((e) => (
                <fieldset className="w-[95%] m-auto border border-solid border-gray-100 p-4 rounded flex flex-col">
                    {settings.length > 1 && <legend>{e.label}</legend>}
                    {e.eeprom.map((eKey, index) => (
                        <EEPROMSettingRow
                            eID={eKey.eId}
                            index={index}
                            key={`${eKey.eId}-${index}`}
                        />
                    ))}
                </fieldset>
            ))}
        </>
    );
}
