import { PiLightning } from 'react-icons/pi';
import { PiUploadSimpleBold, PiDownloadSimpleBold } from 'react-icons/pi';
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
import controller from 'app/lib/controller.ts';
import { EEPROM, EEPROMSettings } from 'app/definitions/firmware';

export function ProfileBar() {
    const {
        rawEEPROM,
        settingsAreDirty,
        setSettingsAreDirty,
        EEPROM,
        settingsValues,
        machineProfile,
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

    function importEEPROMSettings(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files[0];
        try {
            importFirmwareSettings(file, (e) => {
                const uploadedSettings: EEPROMSettings = JSON.parse(
                    e.target.result as string,
                );
                const code = [];
                let formattedSettings: EEPROMSettings = {};

                if (machineProfile.orderedSettings) {
                    // get the ordered settings in first
                    machineProfile.orderedSettings.forEach((_value, key) => {
                        if (uploadedSettings[key as EEPROM]) {
                            formattedSettings[key as EEPROM] =
                                uploadedSettings[key as EEPROM];
                        }
                    });
                    // then get the rest
                    for (const [key, value] of Object.entries(
                        uploadedSettings,
                    )) {
                        if (!formattedSettings[key as EEPROM]) {
                            formattedSettings[key as EEPROM] = value;
                        }
                    }
                } else {
                    formattedSettings = uploadedSettings;
                }

                for (const [key, value] of Object.entries(formattedSettings)) {
                    code.push(`${key}=${value}`);
                }
                code.push('$$');

                controller.command('gcode', code);
                toast.success('EEPROM Settings imported', {
                    position: 'bottom-right',
                });
            });
        } catch (e) {
            toast.error('Unable to import settings', {
                position: 'bottom-right',
            });
        }
    }

    return (
        <div className="fixed flex px-4 max-xl:px-2 bg-white z-50 flex-row items-center  max-w-5xl justify-center bottom-8 max-xl:bottom-4 right-14 max-xl:right-0 h-16 dark:bg-dark">
            <FlashDialog show={flashOpen} toggleShow={toggleFlash} />
            <div className="flex flex-row items-center border border-gray-200 h-12 rounded-lg justify-between">
                <div className="w-1/4 min-w-64  mx-auto px-2">
                    <MachineProfileSelector />
                </div>

                <div className="grid h-full max-w-lg grid-cols-4 font-medium divide-x">
                    <RestoreDefaultDialog />
                    <ActionButton
                        icon={<PiLightning />}
                        label="Flash"
                        onClick={toggleFlash}
                    />
                    <ActionButton
                        icon={<PiDownloadSimpleBold />}
                        label="Import"
                        onClick={() => {
                            inputRef.current.click();
                            inputRef.current.value = null;
                        }}
                        disabled={!connected}
                    />
                    <ActionButton
                        icon={<PiUploadSimpleBold />}
                        label="Export"
                        onClick={() => exportFirmwareSettings(rawEEPROM)}
                        disabled={!connected}
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
