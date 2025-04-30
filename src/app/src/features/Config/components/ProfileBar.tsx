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
import { useRef, useState } from 'react';
import { toast } from 'app/lib/toaster';
import { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';
import cn from 'classnames';
import { ActionButton } from 'app/features/Config/components/ActionButton.tsx';
import { FlashDialog } from 'app/features/Config/components/FlashDialog.tsx';
import { RestoreDefaultDialog } from 'app/features/Config/components/RestoreDefaultDialog.tsx';

interface ProfileBarProps {
    setShowFlashDialog: () => void;
}

export function ProfileBar({ setShowFlashDialog }: ProfileBarProps) {
    const {
        rawEEPROM,
        setEEPROM,
        settingsAreDirty,
        setSettingsAreDirty,
        EEPROM,
        settingsValues,
    } = useSettings();
    const inputRef = useRef(null);
    const [flashOpen, setFlashOpen] = useState(false);

    const connected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    function updateSettingsHandler() {
        updateAllSettings(settingsValues, EEPROM);
        setSettingsAreDirty(false);
    }

    function toggleFlash() {
        setFlashOpen(!flashOpen);
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
        <div className="fixed flex px-4 bg-white z-50 flex-row items-center  max-w-5xl justify-center bottom-8 right-14 h-16 dark:bg-dark">
            <FlashDialog show={flashOpen} toggleShow={toggleFlash} />
            <div className="flex flex-row items-center border border-gray-200 h-16 rounded-lg justify-between">
                <div className="w-1/4 mx-auto">
                    <MachineProfileSelector />
                </div>

                <div className="grid h-full max-w-lg grid-cols-4 font-medium">
                    <ActionButton
                        icon={<CiExport />}
                        label="Export"
                        onClick={() => exportFirmwareSettings(rawEEPROM)}
                        disabled={!connected}
                    />
                    <ActionButton
                        icon={<CiImport />}
                        label="Import"
                        onClick={() => {
                            inputRef.current.click();
                            inputRef.current.value = null;
                        }}
                        disabled={!connected}
                    />
                    <RestoreDefaultDialog />
                    <ActionButton
                        icon={<PiLightning />}
                        label="Flash"
                        onClick={toggleFlash}
                    />
                </div>
            </div>
            <div
                className={cn(
                    'ring rounded relative ml-4',
                    { 'ring-green-600': settingsAreDirty },
                    { 'ring-gray-300': !settingsAreDirty },
                )}
            >
                <button
                    className={cn(
                        'p-3 text-lg rounded-sm border-gray-500',
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
                {settingsAreDirty && (
                    <span className="w-4 h-4 animate-ping absolute -top-2 -left-2 bg-blue-400 rounded-xl"></span>
                )}
                <input
                    type="file"
                    className="hidden"
                    multiple={false}
                    accept=".txt,.json"
                    onChange={importEEPROMSettings}
                    ref={inputRef}
                />
            </div>
        </div>
    );
}
