import React, { useRef, useContext } from 'react';

import store from 'app/store';
import { GRBLHAL } from 'app/constants';
import Tooltip from 'app/components/TooltipCustom/ToolTip';
import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import { Toaster, TOASTER_INFO, TOASTER_DANGER } from 'app/lib/toaster/ToasterLib';

import styles from '../../index.styl';
import { applyNewSettings, FirmwareContext, importFirmwareSettings, exportFirmwareSettings } from '../../utils';
import Notifications from './Notifications';

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
        setSettingsToApply
    } = useContext(FirmwareContext);
    const inputRef = useRef();
    const controllerType = store.get('widgets.connection.controller.type', 'invalid');

    const tooltipContent = controllerType === GRBLHAL
        ? 'Flash your board to grblHAL default values'
        : 'Flash your Arduino board to GRBL default values';

    const openSettingsFile = (e) => {
        const file = e.target.files[0];

        importFirmwareSettings(file, (e) => {
            try {
                const uploadedSettings = JSON.parse(e.target.result);

                Toaster.pop({
                    msg: 'Settings Imported From File',
                    type: TOASTER_INFO
                });

                let newSetting = false;
                setSettings(prev => prev.map((item) => {
                    let value = item.value;
                    if (uploadedSettings[item.setting]) {
                        newSetting = true;
                        value = uploadedSettings[item.setting];
                    }
                    return { ...item, value: value };
                }));
                setSettingsToApply(newSetting);
            } catch (error) {
                Toaster.pop({ msg: 'Unable to Load Settings From File', type: TOASTER_DANGER });
            }

            return null;
        });

        inputRef.current.value = null; //Clear the input element value so we can upload another file
    };

    const exportSettings = (e) => {
        e.preventDefault();

        exportFirmwareSettings(eeprom);
    };

    const flashLabel = {
        grbl: 'Grbl',
        grblHAL: 'grblHAL'
    }[controllerType] ?? 'Grbl';

    return (
        <>
            <Notifications />

            <div className={styles.buttonsContainer}>
                <div>
                    <Tooltip content={tooltipContent} location="default">
                        <ToolModalButton icon="fas fa-bolt" onClick={() => setInitiateFlashing(true, controllerType === GRBLHAL)}>
                            Flash {flashLabel}
                        </ToolModalButton>
                    </Tooltip>
                </div>

                <div className={styles.buttonsMiddle}>
                    <Tooltip content="Import your GRBL settings file" location="default">
                        <ToolModalButton
                            icon="fas fa-file-import"
                            onClick={() => inputRef.current?.click()}
                            disabled={!canSendSettings}
                        >
                            Import Settings
                        </ToolModalButton>
                    </Tooltip>
                    <Tooltip content="Save your current GRBL settings to your device" location="default">
                        <ToolModalButton
                            icon="fas fa-file-export"
                            onClick={exportSettings}
                            disabled={!canSendSettings}
                        >
                            Export Settings
                        </ToolModalButton>
                    </Tooltip>
                    <Tooltip content="Restore the settings for your current machine profile" location="default">
                        <ToolModalButton
                            icon="fas fa-undo"
                            onClick={() => setShouldRestoreDefault(true)}
                            disabled={!canSendSettings}
                        >
                            Restore Defaults
                        </ToolModalButton>
                    </Tooltip>
                </div>

                <Tooltip content="Apply your new changes to the settings" location="default">
                    <ToolModalButton
                        icon="fas fa-tasks"
                        style={{ margin: 0 }}
                        disabled={isDefault || !canSendSettings || !settingsToApply}
                        className={(isDefault || !settingsToApply) ? `${styles.firmwareButtonDisabled}` : `${styles.applySettingsButton}`}
                        onClick={() => applyNewSettings(settings, eeprom, setSettingsToApply)}
                    >
                        Apply New Settings
                    </ToolModalButton>
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
