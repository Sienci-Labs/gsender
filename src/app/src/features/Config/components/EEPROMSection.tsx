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
import controller from 'app/lib/controller.ts';
import { toast } from 'sonner';

export function isEEPROMSettingsSection(s: gSenderEEEPROMSettings): boolean {
    return 'label' in s && 'eeprom' in s;
}

export interface EEPROMSectionProps {
    label: string;
    settings?: gSenderEEEPROMSettings;
}

export function EEPROMSection({
    settings = [],
}: EEPROMSectionProps): JSX.Element {
    const { EEPROM, setSettingsAreDirty, setEEPROM } = useSettings();
    const connected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    if (!connected) {
        return <EEPROMNotConnectedWarning />;
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

    return (
        <>
            {settings.map((e, index) => (
                <fieldset
                    key={`${e.label}-${index}`}
                    className="w-[95%] m-auto border border-solid border-gray-100 p-4 rounded flex flex-col"
                >
                    {settings.length > 1 && <legend>{e.label}</legend>}
                    {e.eeprom.map((eKey, index) => (
                        <EEPROMSettingRow
                            eID={eKey.eId}
                            index={index}
                            key={`${eKey.eId}-${index}`}
                            changeHandler={handleSettingsChange}
                            resetHandler={handleSingleSettingReset}
                        />
                    ))}
                </fieldset>
            ))}
        </>
    );
}
