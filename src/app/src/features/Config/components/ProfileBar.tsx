import { IconFunctionButton } from 'app/features/Config/components/IconFunctionButton.tsx';
import { GrRevert } from 'react-icons/gr';
import { PiLightning } from 'react-icons/pi';
import { CiImport } from 'react-icons/ci';
import { CiExport } from 'react-icons/ci';
import { MachineProfileSelector } from 'app/features/Config/components/MachineProfileSelector.tsx';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import {
    exportFirmwareSettings,
    updateAllSettings,
} from 'app/features/Config/utils/Settings';
import { importFirmwareSettings } from 'app/features/Config/utils/EEPROM.ts';
import { useRef } from 'react';
import { toast } from 'app/lib/toaster';
import { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';
import cn from 'classnames';

interface ProfileBarProps {
    setShowFlashDialog: () => void;
}

export function ProfileBar({ setShowFlashDialog }: ProfileBarProps) {
    const {
        rawEEPROM,
        setEEPROM,
        settingsAreDirty,
        setSettingsAreDirty,
        settings,
        EEPROM,
    } = useSettings();
    const inputRef = useRef(null);

    const connected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    function updateSettingsHandler() {
        updateAllSettings(settings, EEPROM);
        setSettingsAreDirty(false);
    }

    function importEEPROMSettings(e) {
        const file = e.target.files[0];
        try {
            importFirmwareSettings(file, (e) => {
                const uploadedSettings = JSON.parse(e.target.result);
                let newSetting = false;
                setEEPROM((prev) =>
                    prev.map((item) => {
                        let value = item.value;
                        if (uploadedSettings[item.setting]) {
                            newSetting = true;
                            value = uploadedSettings[item.setting];
                        }
                        return { ...item, value: value, dirty: true };
                    }),
                );
            });
            toast.success('EEPROM Settings imported');
        } catch (e) {
            toast.error('Unable to import settings');
        }
    }

    return (
        <div className="flex flex-row w-full p-4 min-h-1/5 justify-around items-center font-sans">
            <div className="border border-gray-200 flex flex-row items-center w-3/5 justify-between px-4 py-2">
                <div className="w-1/4">
                    <MachineProfileSelector />
                </div>

                <div className="flex flex-row gap-10">
                    <IconFunctionButton
                        icon={<CiExport />}
                        label="Export"
                        onClick={() => exportFirmwareSettings(rawEEPROM)}
                        disabled={!connected}
                    />
                    <IconFunctionButton
                        icon={<CiImport />}
                        label="Import"
                        onClick={() => {
                            inputRef.current.click();
                            inputRef.current.value = null;
                        }}
                        disabled={!connected}
                    />
                    <IconFunctionButton
                        icon={<GrRevert />}
                        label="Defaults"
                        disabled={!connected}
                    />
                    <IconFunctionButton
                        icon={<PiLightning />}
                        label="Flash"
                        disabled={true}
                    />
                </div>
            </div>
            <button
                className={cn(
                    'p-3 text-lg rounded border-gray-500',
                    { 'bg-gray-300 text-gray-500': !settingsAreDirty },
                    {
                        'bg-green-600 text-white': settingsAreDirty,
                    },
                )}
                disabled={!settingsAreDirty}
                onClick={updateSettingsHandler}
            >
                Apply Settings
            </button>
            <input
                type="file"
                className="hidden"
                multiple={false}
                accept=".txt,.json"
                onChange={importEEPROMSettings}
                ref={inputRef}
            />
        </div>
    );
}
