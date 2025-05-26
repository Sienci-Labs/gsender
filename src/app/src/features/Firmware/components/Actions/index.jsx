import React, { useRef, useContext } from 'react';

import store from 'app/store';
import { GRBLHAL } from 'app/constants';
import Tooltip from 'app/components/Tooltip';
import Button from 'app/components/Button';
import {
    Toaster,
    TOASTER_INFO,
    TOASTER_DANGER,
} from 'app/lib/toaster/ToasterLib';

import {
    applyNewSettings,
    FirmwareContext,
    importFirmwareSettings,
    exportFirmwareSettings,
} from '../../utils';
import Notifications from './Notifications';

import styles from '../../index.module.styl';
import { toast } from 'app/lib/toaster';

const ActionArea = () => {
    const {
        eeprom,
        settings,
        setInitiateFlashing,
        setShouldRestoreDefault,
        isDefault,
        canSendSettings,
        setSettings,
        settingsToApply,
        setSettingsToApply,
    } = useContext(FirmwareContext);
    const inputRef = useRef(null);
    const controllerType = store.get(
        'widgets.connection.controller.type',
        'invalid',
    );

    const tooltipContent =
        controllerType === GRBLHAL
            ? 'Flash your board to grblHAL default values'
            : 'Flash your Arduino board to GRBL default values';

    const openSettingsFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        importFirmwareSettings(file, (e) => {
            try {
                const uploadedSettings = JSON.parse(e.target.result);

                toast.info('Settings Imported From File', {
                    position: 'bottom-right',
                });

                let newSetting = false;
                setSettings((prev) =>
                    prev.map((item) => {
                        let value = item.value;
                        if (uploadedSettings[item.setting]) {
                            newSetting = true;
                            value = uploadedSettings[item.setting];
                        }
                        return { ...item, value: value };
                    }),
                );
                setSettingsToApply(newSetting);
            } catch (error) {
                toast.error('Unable to Load Settings From File', {
                    position: 'bottom-right',
                });
            }

            return null;
        });

        if (inputRef.current) {
            inputRef.current.value = ''; //Clear the input element value so we can upload another file
        }
    };

    const exportSettings = (e) => {
        e.preventDefault();

        exportFirmwareSettings(eeprom);
    };

    const flashLabel =
        {
            grbl: 'Grbl',
            grblHAL: 'grblHAL',
        }[controllerType] ?? 'Grbl';

    return (
        <>
            <Notifications />

            <div className={styles.buttonsContainer}>
                <Tooltip content={tooltipContent} location="default">
                    <Button
                        icon="fas fa-bolt"
                        onClick={() =>
                            setInitiateFlashing(
                                true,
                                controllerType === GRBLHAL,
                            )
                        }
                        className="w-full"
                    >
                        Flash {flashLabel}
                    </Button>
                </Tooltip>

                <div className={styles.buttonsMiddle}>
                    <Tooltip
                        content="Import your GRBL settings file"
                        location="default"
                    >
                        <Button
                            icon="fas fa-file-import"
                            onClick={() => inputRef.current?.click()}
                            disabled={!canSendSettings}
                            className="w-full"
                        >
                            Import Settings
                        </Button>
                    </Tooltip>
                    <Tooltip
                        content="Save your current GRBL settings to your device"
                        location="default"
                    >
                        <Button
                            icon="fas fa-file-export"
                            onClick={exportSettings}
                            disabled={!canSendSettings}
                            className="w-full"
                        >
                            Export Settings
                        </Button>
                    </Tooltip>
                    <Tooltip
                        content="Restore the settings for your current machine profile"
                        location="default"
                    >
                        <Button
                            icon="fas fa-undo"
                            onClick={() => setShouldRestoreDefault(true)}
                            disabled={!canSendSettings}
                            className="w-full"
                        >
                            Restore Defaults
                        </Button>
                    </Tooltip>
                </div>

                <Tooltip
                    content="Apply your new changes to the settings"
                    location="default"
                >
                    <Button
                        icon="fas fa-tasks"
                        style={{ margin: 0 }}
                        disabled={
                            isDefault || !canSendSettings || !settingsToApply
                        }
                        className={`w-full ${
                            isDefault || !settingsToApply
                                ? `${styles.firmwareButtonDisabled}`
                                : `${styles.applySettingsButton}`
                        }`}
                        onClick={() =>
                            applyNewSettings(
                                settings,
                                eeprom,
                                setSettingsToApply,
                            )
                        }
                    >
                        Apply New Settings
                    </Button>
                </Tooltip>

                <input
                    type="file"
                    className="hidden"
                    multiple={false}
                    accept=".txt,.json"
                    onChange={openSettingsFile}
                    ref={inputRef}
                />
            </div>
        </>
    );
};

export default ActionArea;
