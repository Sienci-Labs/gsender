import {
    gSenderEEEPROMSettings,
    gSenderEEPROMSetting,
    gSenderEEPROMSettingSection,
} from 'app/features/Config/assets/SettingsMenu.ts';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { EEPROMNotConnectedWarning } from 'app/features/Config/components/EEPROMNotConnectedWarning.tsx';
import { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';

function filterNewlines(data = '') {
    if (!data) {
        return '';
    }
    return data.replace(/\\n/gim, '\n');
}

export function isEEPROMSettingsSection(s: gSenderEEEPROMSettings): boolean {
    return 'label' in s && 'eeprom' in s;
}

export interface EEPROMSectionProps {
    label: string;
    settings?: gSenderEEEPROMSettings;
}

export function EEPROMSettingRow(setting: gSenderEEPROMSetting, index: number) {
    const { EEPROM } = useSettings();
    if (!EEPROM) {
        return;
    }
    const EEPROMData = EEPROM.find((s) => s.setting === setting.eId);
    if (EEPROMData) {
        const detailString = `${EEPROMData.setting} - default X - ${filterNewlines(EEPROMData.details)}`;
        return (
            <div
                key={`${EEPROMData.key}`}
                className="odd:bg-robin-100 even:bg-white p-2 flex flex-row items-center"
            >
                <span className="w-1/5">{EEPROMData.description}</span>
                <span className="w-1/5 text-xs px-4">Control</span>
                <span className="text-gray-500 text-sm w-3/5">
                    {detailString}
                </span>
            </div>
        );
    }
    return <></>;
}

export function EEPROMSettingSection(
    section: gSenderEEPROMSettingSection,
    index: number,
) {}

export function EEPROMSection({
    label,
    settings = [],
}: EEPROMSectionProps): JSX.Element {
    const { EEPROM } = useSettings();
    const connected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const components = settings.map((eSetting, index) => {
        if (isEEPROMSettingsSection(eSetting)) {
            return EEPROMSettingSection(eSetting, index);
        } else {
            return EEPROMSettingRow(eSetting, index);
        }
    });
    console.log(components);

    return (
        <fieldset className="w-[95%] m-auto border border-solid border-gray-100 p-4 rounded flex flex-col">
            <legend>{label}</legend>
            {(!connected || Object.keys(EEPROM).length === 0) && (
                <EEPROMNotConnectedWarning />
            )}
            {connected &&
                settings.map((eSetting, index) => {
                    if (isEEPROMSettingsSection(eSetting)) {
                        return EEPROMSettingSection(eSetting, index);
                    } else {
                        return EEPROMSettingRow(eSetting, index);
                    }
                })}
        </fieldset>
    );
}
